import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guruSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guru = await prisma.guru.findUnique({ where: { id: params.id } })
    if (!guru) return NextResponse.json({ error: 'Guru not found' }, { status: 404 })
    return NextResponse.json({ data: guru })
  } catch (error) {
    console.error('GET /api/guru/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = guruSchema.parse(body)

    const guru = await prisma.guru.update({ where: { id: params.id }, data })
    return NextResponse.json({ data: guru })
  } catch (error) {
    console.error('PUT /api/guru/[id]:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.guru.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Guru deleted' })
  } catch (error) {
    console.error('DELETE /api/guru/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
