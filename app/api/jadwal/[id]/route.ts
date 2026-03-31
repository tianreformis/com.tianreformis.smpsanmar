import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jadwalSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const jadwal = await prisma.jadwal.findUnique({
      where: { id: params.id },
      include: { kelas: true, mapel: true, guru: true }
    })

    if (!jadwal) return NextResponse.json({ error: 'Jadwal not found' }, { status: 404 })
    return NextResponse.json({ data: jadwal })
  } catch (error) {
    console.error('GET /api/jadwal/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = jadwalSchema.parse(body)

    const jadwal = await prisma.jadwal.update({ where: { id: params.id }, data })
    return NextResponse.json({ data: jadwal })
  } catch (error) {
    console.error('PUT /api/jadwal/[id]:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.jadwal.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Jadwal deleted' })
  } catch (error) {
    console.error('DELETE /api/jadwal/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
