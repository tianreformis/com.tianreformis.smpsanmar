import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations'
import { formatZodErrors } from '@/lib/error-handler'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = forgotPasswordSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: formatZodErrors(validated.error) },
        { status: 400 }
      )
    }

    const { email, reason } = validated.data

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 404 }
      )
    }

    const existingPending = await prisma.passwordResetRequest.findFirst({
      where: { email, status: 'pending' }
    })

    if (existingPending) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki request yang sedang menunggu' },
        { status: 400 }
      )
    }

    const request = await prisma.passwordResetRequest.create({
      data: {
        email,
        userId: user.id,
        reason: reason || null,
        status: 'pending'
      }
    })

    return NextResponse.json({
      message: 'Request lupa password berhasil dikirim. Tunggu admin memproses.',
      data: { id: request.id }
    })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
