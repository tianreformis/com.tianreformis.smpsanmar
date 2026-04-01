import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const tahunPelajaranId = searchParams.get('tahunPelajaranId') || ''

    const whereKelas: any = {}
    const whereSiswa: any = {}
    const wherePPDB: any = { status: 'pending' }

    if (tahunPelajaranId) {
      whereKelas.tahunPelajaranId = tahunPelajaranId
      whereSiswa.tahunPelajaranId = tahunPelajaranId
      wherePPDB.tahunPelajaranId = tahunPelajaranId
    }

    const [totalSiswa, totalGuru, totalKelas, totalPPDB, siswaPerKelas] = await Promise.all([
      prisma.siswa.count({ where: whereSiswa }),
      prisma.guru.count(),
      prisma.kelas.count({ where: whereKelas }),
      prisma.pPDB.count({ where: wherePPDB }),
      prisma.kelas.findMany({
        where: whereKelas,
        select: { nama_kelas: true, _count: { select: { siswa: true } } },
        orderBy: { nama_kelas: 'asc' }
      })
    ])

    return NextResponse.json({
      data: {
        totalSiswa,
        totalGuru,
        totalKelas,
        totalPPDB,
        siswaPerKelas: siswaPerKelas.map(k => ({ nama: k.nama_kelas, value: k._count.siswa }))
      }
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
