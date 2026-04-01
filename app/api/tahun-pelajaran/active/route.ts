import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const active = await prisma.tahunPelajaran.findFirst({ where: { isActive: true } })
    return NextResponse.json({ data: active })
  } catch (error) {
    console.error('GET /api/tahun-pelajaran/active:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
