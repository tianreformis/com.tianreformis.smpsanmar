import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await prisma.tahunPelajaran.findMany({
      orderBy: { tahun: 'desc' }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/tahun-pelajaran:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { tahun, isActive } = body

    if (!tahun) return NextResponse.json({ error: 'Tahun pelajaran harus diisi' }, { status: 400 })

    const existing = await prisma.tahunPelajaran.findUnique({ where: { tahun } })
    if (existing) return NextResponse.json({ error: 'Tahun pelajaran sudah ada' }, { status: 400 })

    let created = await prisma.tahunPelajaran.create({
      data: { tahun, isActive: isActive || false }
    })

    if (isActive) {
      await prisma.tahunPelajaran.updateMany({
        where: { id: { not: created.id } },
        data: { isActive: false }
      })
    }

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/tahun-pelajaran:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, tahun, isActive } = body

    if (!id) return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 })

    if (tahun) {
      const dup = await prisma.tahunPelajaran.findFirst({ where: { tahun, id: { not: id } } })
      if (dup) return NextResponse.json({ error: 'Tahun pelajaran sudah ada' }, { status: 400 })
    }

    let updated = await prisma.tahunPelajaran.update({
      where: { id },
      data: { ...(tahun && { tahun }), ...(typeof isActive === 'boolean' && { isActive }) }
    })

    if (isActive) {
      await prisma.tahunPelajaran.updateMany({
        where: { id: { not: id } },
        data: { isActive: false }
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('PUT /api/tahun-pelajaran:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 })

    const active = await prisma.tahunPelajaran.findUnique({ where: { id } })
    if (active?.isActive) return NextResponse.json({ error: 'Tidak bisa hapus tahun pelajaran aktif' }, { status: 400 })

    await prisma.tahunPelajaran.delete({ where: { id } })
    return NextResponse.json({ message: 'Berhasil hapus' })
  } catch (error: any) {
    console.error('DELETE /api/tahun-pelajaran:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
