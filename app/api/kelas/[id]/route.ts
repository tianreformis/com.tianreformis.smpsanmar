import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { kelasSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const kelas = await prisma.kelas.findUnique({
      where: { id: params.id },
      include: { waliKelas: true, siswa: true, jadwal: { include: { mapel: true, guru: true } } }
    })

    if (!kelas) return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })
    return NextResponse.json({ data: kelas })
  } catch (error) {
    console.error('GET /api/kelas/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = kelasSchema.parse(body)
    const { waliKelasId, ...rest } = data

    const kelas = await prisma.kelas.update({
      where: { id: params.id },
      data: { ...rest, waliKelasId: waliKelasId || null }
    })
    return NextResponse.json({ data: kelas })
  } catch (error) {
    console.error('PUT /api/kelas/[id]:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.kelas.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Kelas deleted' })
  } catch (error) {
    console.error('DELETE /api/kelas/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
