import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { siswaIds, kelasId, tahunPelajaranId, catatan } = body

    if (!siswaIds || !Array.isArray(siswaIds) || siswaIds.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal 1 siswa' }, { status: 400 })
    }

    // Get new kelas info
    const newKelas = kelasId ? await prisma.kelas.findUnique({ where: { id: kelasId } }) : null
    if (kelasId && !newKelas) {
      return NextResponse.json({ error: 'Kelas tujuan tidak ditemukan' }, { status: 400 })
    }

    // Get old TP info
    const oldTP = tahunPelajaranId ? await prisma.tahunPelajaran.findUnique({ where: { id: tahunPelajaranId } }) : null

    const results = []

    for (const siswaId of siswaIds) {
      const siswa = await prisma.siswa.findUnique({ where: { id: siswaId } })
      if (!siswa) continue

      const updateData: any = {}
      if (kelasId) updateData.kelasId = kelasId
      if (tahunPelajaranId) updateData.tahunPelajaranId = tahunPelajaranId

      // Record class history
      if (siswa.kelasId || siswa.tahunPelajaranId) {
        const oldKelas = siswa.kelasId ? await prisma.kelas.findUnique({ where: { id: siswa.kelasId } }) : null
        const newKelasRecord = kelasId ? await prisma.kelas.findUnique({ where: { id: kelasId } }) : null

        await prisma.riwayatKelas.upsert({
          where: { siswaId_tahunPelajaranId: { siswaId, tahunPelajaranId: tahunPelajaranId || siswa.tahunPelajaranId } },
          update: {
            kelasId: kelasId || siswa.kelasId,
            catatan: catatan || (oldKelas?.nama_kelas === newKelasRecord?.nama_kelas ? 'Tinggal kelas' : 'Naik kelas')
          },
          create: {
            siswaId,
            kelasId: kelasId || siswa.kelasId,
            tahunPelajaranId: tahunPelajaranId || siswa.tahunPelajaranId,
            catatan: catatan || (oldKelas?.nama_kelas === newKelasRecord?.nama_kelas ? 'Tinggal kelas' : 'Naik kelas')
          }
        })
      }

      const updated = await prisma.siswa.update({
        where: { id: siswaId },
        data: updateData
      })
      results.push(updated)
    }

    return NextResponse.json({
      data: results,
      message: `${results.length} siswa berhasil dipindahkan`
    })
  } catch (error: any) {
    console.error('POST /api/siswa/transfer:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
