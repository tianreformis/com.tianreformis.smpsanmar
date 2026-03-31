import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { userSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = userSchema.parse(body)
    
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        siswaId: data.siswaId,
        guruId: data.guruId
      }
    })
    
    return NextResponse.json({ message: 'User created', data: user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
