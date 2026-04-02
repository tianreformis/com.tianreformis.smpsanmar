import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'KEPALA_SEKOLAH'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { newTahun, kelasMappings } = body

    if (!newTahun) return NextResponse.json({ error: 'Tahun pelajaran baru harus diisi' }, { status: 400 })

    // Check if new tahun pelajaran already exists
    const existingTP = await prisma.tahunPelajaran.findUnique({ where: { tahun: newTahun } })
    if (existingTP) return NextResponse.json({ error: 'Tahun pelajaran sudah ada' }, { status: 400 })

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get old active TP BEFORE creating new one
      const oldTP = await tx.tahunPelajaran.findFirst({ where: { isActive: true } })
      if (!oldTP) throw new Error('Tidak ada tahun pelajaran aktif')

      // 2. Create new tahun pelajaran
      const newTP = await tx.tahunPelajaran.create({
        data: { tahun: newTahun, isActive: true }
      })

      // 3. Deactivate old active TP
      await tx.tahunPelajaran.update({ where: { id: oldTP.id }, data: { isActive: false } })

      // 4. Get old classes
      const oldKelas = await tx.kelas.findMany({ where: { tahunPelajaranId: oldTP.id } })

      // 5. Create new classes with mappings (copy waliKelasId)
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

      // 5. Copy students to new year with class mappings (skip if exists)
      const oldSiswa = await tx.siswa.findMany({ where: { tahunPelajaranId: oldTP?.id || '' } })
      let siswaCount = 0
      for (const siswa of oldSiswa) {
        // Check if student already exists in new tahun pelajaran
        const existingSiswa = await tx.siswa.findFirst({
          where: { nisn: siswa.nisn, tahunPelajaranId: newTP.id }
        })
        if (existingSiswa) continue

        const newKelasId = newKelasMap[siswa.kelasId || ''] || null

        try {
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
          siswaCount++

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
        } catch (e: any) {
          if (e.code === 'P2002') continue
          throw e
        }
      }

      // 6. Copy mapel (with new kelas assignments)
      const oldMapel = await tx.mapel.findMany({ where: { tahunPelajaranId: oldTP?.id || '' } })
      let mapelCount = 0
      for (const mapel of oldMapel) {
        const newKelasId = newKelasMap[mapel.kelasId]
        if (!newKelasId) continue
        
        // Check if mapel already exists
        const existingMapel = await tx.mapel.findFirst({
          where: { nama_mapel: mapel.nama_mapel, kelasId: newKelasId, tahunPelajaranId: newTP.id, semester: mapel.semester }
        })
        if (existingMapel) continue
        
        await tx.mapel.create({
          data: {
            nama_mapel: mapel.nama_mapel,
            kelasId: newKelasId,
            tahunPelajaranId: newTP.id,
            semester: mapel.semester
          }
        })
        mapelCount++
      }

      return { newTP, newKelasMap, siswaCount, mapelCount }
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
