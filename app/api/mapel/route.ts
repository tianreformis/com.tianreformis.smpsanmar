import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mapelSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await prisma.mapel.findMany({
      include: { guru: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data })
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
    const data = mapelSchema.parse(body)
    const { guruId, ...rest } = data

    const mapel = await prisma.mapel.create({ data: { ...rest, guruId: guruId || null } })
    return NextResponse.json({ data: mapel }, { status: 201 })
  } catch (error) {
    console.error('POST /api/mapel:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
