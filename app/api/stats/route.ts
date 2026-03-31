import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [totalSiswa, totalGuru, totalKelas, totalPPDB, siswaPerKelas] = await Promise.all([
      prisma.siswa.count(),
      prisma.guru.count(),
      prisma.kelas.count(),
      prisma.pPDB.count({ where: { status: 'pending' } }),
      prisma.kelas.findMany({
        select: { nama_kelas: true, _count: { select: { siswa: true } } }
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
