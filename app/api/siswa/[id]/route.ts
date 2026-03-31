import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { siswaSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const { kelasId, tanggal_lahir, ...rest } = body

    const siswa = await prisma.siswa.update({
      where: { id: params.id },
      data: {
        ...rest,
        tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : undefined,
        kelasId: kelasId || null
      }
    })
    
    return NextResponse.json({ data: siswa })
  } catch (error: any) {
    console.error('PUT /api/siswa/[id]:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
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
