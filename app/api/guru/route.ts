import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guruSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { formatZodErrors } from '@/lib/error-handler'
import bcrypt from 'bcryptjs'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [{ nama: { contains: search } }, { nip: { contains: search } }]
    } : {}

    const [data, total] = await Promise.all([
      prisma.guru.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.guru.count({ where })
    ])

    return NextResponse.json({ data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('GET /api/guru:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const validated = guruSchema.parse(body)
    const { nip, nama, email, no_hp, alamat, foto } = validated

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash('guru123', 10)

    const guru = await prisma.guru.create({
      data: {
        nama,
        email,
        no_hp,
        alamat,
        nip: nip || undefined,
        foto: foto || undefined,
        user: {
          create: {
            email,
            password: hashedPassword,
            name: nama,
            role: 'GURU'
          }
        }
      } as any
    })
    return NextResponse.json({ data: guru }, { status: 201 })
  } catch (error) {
    console.error('POST /api/guru:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
