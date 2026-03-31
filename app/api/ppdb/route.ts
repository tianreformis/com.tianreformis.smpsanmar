import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ppdbSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { generateNoPendaftaran } from '@/lib/utils'
import { formatZodErrors } from '@/lib/error-handler'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where = status ? { status } : {}

    const data = await prisma.pPDB.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = ppdbSchema.parse(body)

    const noPendaftaran = generateNoPendaftaran()
    
    const ppdb = await prisma.pPDB.create({
      data: { ...data, no_pendaftaran: noPendaftaran }
    })
    
    return NextResponse.json({ data: ppdb, message: 'Pendaftaran berhasil' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
