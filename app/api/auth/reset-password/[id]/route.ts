import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetPasswordAdminSchema } from '@/lib/validations'
import { formatZodErrors } from '@/lib/error-handler'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = resetPasswordAdminSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: formatZodErrors(validated.error) },
        { status: 400 }
      )
    }

    const { newPassword, adminNote } = validated.data
    const requestId = params.id

    const request = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return NextResponse.json(
        { error: 'Request tidak ditemukan' },
        { status: 404 }
      )
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request sudah diproses' },
        { status: 400 }
      )
    }

    if (!request.userId) {
      return NextResponse.json(
        { error: 'User tidak ditemukan untuk request ini' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: request.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          newPassword,
          adminNote: adminNote || null,
          adminId: session.user.id
        }
      })
    ])

    return NextResponse.json({
      message: 'Password berhasil direset dan request disetujui'
    })
  } catch (error) {
    console.error('PUT /api/auth/reset-password/[id]:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params.id
    const body = await req.json()
    const { adminNote } = body

    const request = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return NextResponse.json(
        { error: 'Request tidak ditemukan' },
        { status: 404 }
      )
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request sudah diproses' },
        { status: 400 }
      )
    }

    await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        adminNote: adminNote || null,
        adminId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Request berhasil ditolak'
    })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
