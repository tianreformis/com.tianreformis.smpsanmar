import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const tahunPelajaranId = searchParams.get('tahunPelajaranId') || ''
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [{ nama: { contains: search } }, { nisn: { contains: search } }]
    }
    if (tahunPelajaranId) {
      where.tahunPelajaranId = tahunPelajaranId
    }

    const [data, total] = await Promise.all([
      prisma.siswa.findMany({ where, include: { kelas: true, user: { select: { email: true } } }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.siswa.count({ where })
    ])

    return NextResponse.json({ data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('GET /api/siswa:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { kelasId, tahunPelajaranId, ...rest } = body

    const activeTP = tahunPelajaranId || (await prisma.tahunPelajaran.findFirst({ where: { isActive: true } }))?.id
    if (!activeTP) return NextResponse.json({ error: 'Tidak ada tahun pelajaran aktif' }, { status: 400 })

    const hashedPassword = await bcrypt.hash('siswa123', 10)

    const siswa = await prisma.siswa.create({
      data: {
        ...rest,
        tanggal_lahir: new Date(rest.tanggal_lahir),
        kelasId: kelasId || null,
        tahunPelajaranId: activeTP,
        user: {
          create: {
            email: `${rest.nisn}@student.sch.id`,
            password: hashedPassword,
            name: rest.nama,
            role: 'SISWA'
          }
        }
      }
    })
    return NextResponse.json({ data: siswa }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/siswa:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
