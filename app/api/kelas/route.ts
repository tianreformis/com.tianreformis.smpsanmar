import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { kelasSchema } from '@/lib/validations'
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
      prisma.kelas.findMany({
        where,
        include: { waliKelas: true, _count: { select: { siswa: true } } },
        skip, take: limit, orderBy: { createdAt: 'desc' }
      }),
      prisma.kelas.count({ where })
    ])

    return NextResponse.json({ data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('GET /api/kelas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { tahunPelajaranId, ...restBody } = body
    const data = kelasSchema.parse(restBody)
    const { waliKelasId } = data

    const activeTP = tahunPelajaranId || (await prisma.tahunPelajaran.findFirst({ where: { isActive: true } }))?.id
    if (!activeTP) return NextResponse.json({ error: 'Tidak ada tahun pelajaran aktif' }, { status: 400 })

    const kelas = await prisma.kelas.create({ data: { ...data, waliKelasId: waliKelasId || null, tahunPelajaranId: activeTP } })
    return NextResponse.json({ data: kelas }, { status: 201 })
  } catch (error) {
    console.error('POST /api/kelas:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
