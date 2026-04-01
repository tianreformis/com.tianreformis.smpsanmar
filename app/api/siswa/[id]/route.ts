import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { siswaSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { formatZodErrors } from '@/lib/error-handler'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const siswa = await prisma.siswa.findUnique({
      where: { id: params.id },
      include: { kelas: true, nilai: { include: { mapel: true } } }
    })

    if (!siswa) return NextResponse.json({ error: 'Siswa not found' }, { status: 404 })
    return NextResponse.json({ data: siswa })
  } catch (error) {
    console.error('GET /api/siswa/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { kelasId, tanggal_lahir, email, ...rest } = body

    const siswa = await prisma.siswa.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!siswa) return NextResponse.json({ error: 'Siswa not found' }, { status: 404 })

    const updateData: any = {
      ...rest,
      tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : undefined,
      kelasId: kelasId || null
    }

    if (email && siswa.user) {
      const existingUser = await prisma.user.findFirst({
        where: { email, id: { not: siswa.user.id } }
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: siswa.user.id },
        data: { email }
      })
    }

    const updatedSiswa = await prisma.siswa.update({
      where: { id: params.id },
      data: updateData
    })
    
    return NextResponse.json({ data: updatedSiswa })
  } catch (error: any) {
    console.error('PUT /api/siswa/[id]:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.siswa.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Siswa deleted' })
  } catch (error) {
    console.error('DELETE /api/siswa/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
