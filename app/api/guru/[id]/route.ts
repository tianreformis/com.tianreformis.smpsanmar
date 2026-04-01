import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guruSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { formatZodErrors } from '@/lib/error-handler'

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
    const validated = guruSchema.parse(body)
    const { nip, nama, email, no_hp, alamat, foto } = validated

    const guru = await prisma.guru.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!guru) return NextResponse.json({ error: 'Guru not found' }, { status: 404 })

    if (email !== guru.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, id: { not: guru.user?.id || '' } }
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
      }

      if (guru.user) {
        await prisma.user.update({
          where: { id: guru.user.id },
          data: { email, name: nama }
        })
      }
    }

    const updatedGuru = await prisma.guru.update({
      where: { id: params.id },
      data: {
        nama,
        email,
        no_hp,
        alamat,
        nip: nip || undefined,
        foto: foto || undefined
      }
    })

    return NextResponse.json({ data: updatedGuru })
  } catch (error) {
    console.error('PUT /api/guru/[id]:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
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
