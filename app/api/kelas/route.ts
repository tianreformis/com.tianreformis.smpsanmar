import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { kelasSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await prisma.kelas.findMany({
      include: { waliKelas: true, _count: { select: { siswa: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data })
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
    const data = kelasSchema.parse(body)
    const { waliKelasId, ...rest } = data

    const kelas = await prisma.kelas.create({ data: { ...rest, waliKelasId: waliKelasId || null } })
    return NextResponse.json({ data: kelas }, { status: 201 })
  } catch (error) {
    console.error('POST /api/kelas:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
