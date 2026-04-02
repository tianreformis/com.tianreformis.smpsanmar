import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'KEPALA_SEKOLAH'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where = {
      role: { in: ['ADMIN', 'KEPALA_SEKOLAH'] },
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      })
    }

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      data: admins,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'KEPALA_SEKOLAH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, name, role } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userRole = role === 'KEPALA_SEKOLAH' ? 'KEPALA_SEKOLAH' : 'ADMIN'

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole
      }
    })

    return NextResponse.json({
      message: 'Admin berhasil dibuat',
      data: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
