import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    })

    return NextResponse.json({ data: user })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, email, currentPassword, newPassword } = body

    const userId = session.user.id
    const userEmail = session.user.email

    let existingUser = null
    if (userId) {
      existingUser = await prisma.user.findUnique({ where: { id: userId } })
    }
    if (!existingUser && userEmail) {
      existingUser = await prisma.user.findUnique({ where: { email: userEmail } })
    }
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updateData: any = {}

    if (name) updateData.name = name

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } })
      if (emailExists) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
      updateData.email = email
    }

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Password lama diperlukan' }, { status: 400 })
      const isValid = await bcrypt.compare(currentPassword, existingUser.password)
      if (!isValid) return NextResponse.json({ error: 'Password lama salah' }, { status: 400 })
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ data: { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role } })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true }
    })

    if (email && email !== existingUser.email) {
      if (existingUser.guruId) {
        await prisma.guru.update({ where: { id: existingUser.guruId }, data: { email } })
      }
      if (existingUser.siswaId) {
        await prisma.siswa.update({ where: { id: existingUser.siswaId }, data: { no_hp: existingUser.siswaId } })
      }
    }

    return NextResponse.json({ data: updatedUser })
  } catch (error: any) {
    console.error('PUT /api/settings:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
