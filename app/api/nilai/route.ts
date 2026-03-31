import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nilaiSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { formatZodErrors } from '@/lib/error-handler'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const siswaId = searchParams.get('siswaId')
    const mapelId = searchParams.get('mapelId')
    const semester = searchParams.get('semester')

    const where: any = {}
    if (siswaId) where.siswaId = siswaId
    if (mapelId) where.mapelId = mapelId
    if (semester) where.semester = semester

    const data = await prisma.nilai.findMany({
      where,
      include: { siswa: true, mapel: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'GURU'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = nilaiSchema.parse(body)

    const existing = await prisma.nilai.findFirst({
      where: { siswaId: data.siswaId, mapelId: data.mapelId, semester: data.semester }
    })

    let nilai
    if (existing) {
      nilai = await prisma.nilai.update({
        where: { id: existing.id },
        data: { nilai: data.nilai }
      })
    } else {
      nilai = await prisma.nilai.create({ data })
    }

    await logActivity(session.user.id, 'INPUT_NILAI', `Input nilai for siswa`)
    
    return NextResponse.json({ data: nilai }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
