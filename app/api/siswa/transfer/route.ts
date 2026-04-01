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
    const { siswaIds, kelasId, catatan } = body

    if (!siswaIds || !Array.isArray(siswaIds) || siswaIds.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal 1 siswa' }, { status: 400 })
    }

    if (!kelasId) {
      return NextResponse.json({ error: 'Kelas tujuan harus dipilih' }, { status: 400 })
    }

    const newKelas = await prisma.kelas.findUnique({ where: { id: kelasId } })
    if (!newKelas) {
      return NextResponse.json({ error: 'Kelas tujuan tidak ditemukan' }, { status: 400 })
    }

    const results = []

    for (const siswaId of siswaIds) {
      const siswa = await prisma.siswa.findUnique({ where: { id: siswaId } })
      if (!siswa) continue

      const oldKelas = siswa.kelasId ? await prisma.kelas.findUnique({ where: { id: siswa.kelasId } }) : null

      await prisma.riwayatKelas.upsert({
        where: { siswaId_tahunPelajaranId: { siswaId, tahunPelajaranId: siswa.tahunPelajaranId } },
        update: {
          kelasId,
          catatan: catatan || (oldKelas?.nama_kelas === newKelas?.nama_kelas ? 'Tinggal kelas' : 'Naik kelas')
        },
        create: {
          siswaId,
          kelasId,
          tahunPelajaranId: siswa.tahunPelajaranId,
          catatan: catatan || (oldKelas?.nama_kelas === newKelas?.nama_kelas ? 'Tinggal kelas' : 'Naik kelas')
        }
      })

      const updated = await prisma.siswa.update({
        where: { id: siswaId },
        data: { kelasId }
      })
      results.push(updated)
    }

    return NextResponse.json({
      data: results,
      message: `${results.length} siswa berhasil dipindahkan ke ${newKelas.nama_kelas}`
    })
  } catch (error: any) {
    console.error('POST /api/siswa/transfer:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
