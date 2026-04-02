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
    const { newTahun, kelasMappings } = body

    if (!newTahun) return NextResponse.json({ error: 'Tahun pelajaran baru harus diisi' }, { status: 400 })

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create new tahun pelajaran
      const newTP = await tx.tahunPelajaran.create({
        data: { tahun: newTahun, isActive: true }
      })

      // 2. Deactivate old active TP
      const oldTP = await tx.tahunPelajaran.findFirst({ where: { isActive: true } })
      if (oldTP && oldTP.id !== newTP.id) {
        await tx.tahunPelajaran.update({ where: { id: oldTP.id }, data: { isActive: false } })
      }

      // 3. Get old classes
      const oldKelas = await tx.kelas.findMany({ where: { tahunPelajaranId: oldTP?.id || '' } })

      // 4. Create new classes with mappings
      const newKelasMap: Record<string, string> = {}
      for (const mapping of kelasMappings) {
        const newKelas = await tx.kelas.create({
          data: {
            nama_kelas: mapping.nama,
            tahunPelajaranId: newTP.id,
            waliKelasId: mapping.waliKelasId || null
          }
        })
        newKelasMap[mapping.oldKelasId] = newKelas.id
      }

      // 5. Copy students to new year with class mappings
      const oldSiswa = await tx.siswa.findMany({ where: { tahunPelajaranId: oldTP?.id || '' } })
      for (const siswa of oldSiswa) {
        const newKelasId = newKelasMap[siswa.kelasId || ''] || null

        const newSiswa = await tx.siswa.create({
          data: {
            nisn: siswa.nisn,
            nama: siswa.nama,
            jenis_kelamin: siswa.jenis_kelamin,
            tanggal_lahir: siswa.tanggal_lahir,
            alamat: siswa.alamat,
            no_hp: siswa.no_hp,
            foto: siswa.foto,
            tahunPelajaranId: newTP.id,
            kelasId: newKelasId
          }
        })

        // Record class history
        if (oldTP && siswa.kelasId) {
          const oldKelas = await tx.kelas.findUnique({ where: { id: siswa.kelasId } })
          const newKelas = newKelasId ? await tx.kelas.findUnique({ where: { id: newKelasId } }) : null
          await tx.riwayatKelas.create({
            data: {
              siswaId: newSiswa.id,
              kelasId: newKelasId || siswa.kelasId,
              tahunPelajaranId: newTP.id,
              catatan: oldKelas?.nama_kelas === newKelas?.nama_kelas ? 'Tinggal kelas' : 'Naik kelas'
            }
          })
        }
      }

      // 6. Copy mapel (with kelas assignments)
      const oldMapel = await tx.mapel.findMany({ where: { tahunPelajaranId: oldTP?.id || '' } })
      for (const mapel of oldMapel) {
        await tx.mapel.create({
          data: {
            nama_mapel: mapel.nama_mapel,
            kelasId: mapel.kelasId,
            tahunPelajaranId: newTP.id,
            semester: mapel.semester
          }
        })
      }

      return { newTP, newKelasMap, siswaCount: oldSiswa.length, mapelCount: oldMapel.length }
    })

    return NextResponse.json({
      data: result,
      message: `Roll over berhasil! ${result.siswaCount} siswa dan ${result.mapelCount} mapel telah disalin ke tahun pelajaran ${newTahun}`
    })
  } catch (error: any) {
    console.error('POST /api/tahun-pelajaran/roll-over:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
