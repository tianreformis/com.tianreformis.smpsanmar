import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mapelSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { formatZodErrors } from '@/lib/error-handler'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const mapel = await prisma.mapel.findUnique({ where: { id: params.id }, include: { guru: true } })
    if (!mapel) return NextResponse.json({ error: 'Mapel not found' }, { status: 404 })
    return NextResponse.json({ data: mapel })
  } catch (error) {
    console.error('GET /api/mapel/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { guruId, ...rest } = body
    const data = mapelSchema.parse(rest)

    const mapel = await prisma.mapel.update({
      where: { id: params.id },
      data: { ...data, guruId: guruId || null }
    })
    return NextResponse.json({ data: mapel })
  } catch (error) {
    console.error('PUT /api/mapel/[id]:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.mapel.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Mapel deleted' })
  } catch (error) {
    console.error('DELETE /api/mapel/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
