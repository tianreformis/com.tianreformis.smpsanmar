import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { siswaSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [{ nama: { contains: search } }, { nisn: { contains: search } }]
    } : {}

    const [data, total] = await Promise.all([
      prisma.siswa.findMany({ where, include: { kelas: true }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
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
    const { kelasId, ...rest } = body

    const siswa = await prisma.siswa.create({
      data: {
        ...rest,
        tanggal_lahir: new Date(rest.tanggal_lahir),
        kelasId: kelasId || null
      }
    })
    return NextResponse.json({ data: siswa }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/siswa:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
