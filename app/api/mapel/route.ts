import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mapelSchema } from '@/lib/validations'
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
    const tahunPelajaranId = searchParams.get('tahunPelajaranId') || ''
    const skip = (page - 1) * limit

    const where: any = {}
    if (tahunPelajaranId) where.tahunPelajaranId = tahunPelajaranId

    const [data, total] = await Promise.all([
      prisma.mapel.findMany({ where, include: { guru: true }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.mapel.count({ where })
    ])

    return NextResponse.json({ data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('GET /api/mapel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { guruId, tahunPelajaranId, ...rest } = body
    const data = mapelSchema.parse(rest)

    const activeTP = tahunPelajaranId || (await prisma.tahunPelajaran.findFirst({ where: { isActive: true } }))?.id
    if (!activeTP) return NextResponse.json({ error: 'Tidak ada tahun pelajaran aktif' }, { status: 400 })

    const mapel = await prisma.mapel.create({ data: { ...data, guruId: guruId || null, tahunPelajaranId: activeTP } })
    return NextResponse.json({ data: mapel }, { status: 201 })
  } catch (error) {
    console.error('POST /api/mapel:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
