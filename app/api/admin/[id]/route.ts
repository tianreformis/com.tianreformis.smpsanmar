import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'KEPALA_SEKOLAH'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: admin })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'KEPALA_SEKOLAH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, role } = body

    const existingAdmin = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })
    }

    if (existingAdmin.role === 'KEPALA_SEKOLAH' && session.user.role !== 'KEPALA_SEKOLAH') {
      return NextResponse.json({ error: 'Tidak dapat mengedit kepala sekolah' }, { status: 403 })
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        ...(role && { role })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return NextResponse.json({ message: 'Admin berhasil diperbarui', data: updatedAdmin })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'KEPALA_SEKOLAH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const existingAdmin = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })
    }

    if (existingAdmin.role === 'KEPALA_SEKOLAH') {
      return NextResponse.json({ error: 'Tidak dapat mengubah password kepala sekolah melalui fitur ini' }, { status: 403 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'KEPALA_SEKOLAH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingAdmin = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })
    }

    if (existingAdmin.role === 'KEPALA_SEKOLAH') {
      return NextResponse.json({ error: 'Tidak dapat menghapus kepala sekolah' }, { status: 403 })
    }

    if (existingAdmin.id === session.user.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Admin berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
