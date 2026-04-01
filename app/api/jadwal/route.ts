import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jadwalSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { formatZodErrors } from '@/lib/error-handler'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const kelasId = searchParams.get('kelasId')
    const hari = searchParams.get('hari')
    const skip = (page - 1) * limit

    const where: any = {}
    if (kelasId) where.kelasId = kelasId
    if (hari) where.hari = hari

    const [data, total] = await Promise.all([
      prisma.jadwal.findMany({
        where, include: { kelas: true, mapel: true, guru: true },
        skip, take: limit, orderBy: [{ hari: 'asc' }, { jam_mulai: 'asc' }]
      }),
      prisma.jadwal.count({ where })
    ])

    return NextResponse.json({ data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('GET /api/jadwal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = jadwalSchema.parse(body)

    const jadwal = await prisma.jadwal.create({ data })
    return NextResponse.json({ data: jadwal }, { status: 201 })
  } catch (error) {
    console.error('POST /api/jadwal:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
