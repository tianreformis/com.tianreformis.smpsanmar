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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const siswaId = searchParams.get('siswaId')
    const mapelId = searchParams.get('mapelId')
    const semester = searchParams.get('semester')
    const tahunPelajaranId = searchParams.get('tahunPelajaranId')
    const skip = (page - 1) * limit

    const where: any = {}
    if (siswaId) where.siswaId = siswaId
    if (mapelId) where.mapelId = mapelId
    if (semester) where.semester = semester
    if (tahunPelajaranId) where.tahunPelajaranId = tahunPelajaranId

    const [data, total] = await Promise.all([
      prisma.nilai.findMany({ where, include: { siswa: true, mapel: true }, skip, take: limit, orderBy: { tanggal: 'desc' } }),
      prisma.nilai.count({ where })
    ])

    return NextResponse.json({ data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
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
    const { tahunPelajaranId, jenis, tanggal, ...rest } = body
    const data = nilaiSchema.parse(rest)

    // 1. Validate tahun pelajaran
    const activeTP = tahunPelajaranId || (await prisma.tahunPelajaran.findFirst({ where: { isActive: true } }))?.id
    if (!activeTP) return NextResponse.json({ error: 'Tidak ada tahun pelajaran aktif' }, { status: 400 })

    // 2. Validate mapel exists for this TP + semester
    const mapel = await prisma.mapel.findFirst({
      where: { id: data.mapelId, tahunPelajaranId: activeTP, semester: data.semester }
    })
    if (!mapel) {
      return NextResponse.json({
        error: `Mapel tidak ditemukan pada tahun pelajaran ${activeTP} semester ${data.semester}`
      }, { status: 400 })
    }

    // 3. Validate siswa exists for this TP
    const siswa = await prisma.siswa.findFirst({
      where: { id: data.siswaId, tahunPelajaranId: activeTP }
    })
    if (!siswa) {
      return NextResponse.json({
        error: `Siswa tidak terdaftar pada tahun pelajaran ini`
      }, { status: 400 })
    }

    // 4. Check if same jenis already exists for this siswa + mapel + semester
    const existing = await prisma.nilai.findFirst({
      where: { siswaId: data.siswaId, mapelId: data.mapelId, semester: data.semester, tahunPelajaranId: activeTP, jenis }
    })
    if (existing) {
      return NextResponse.json({
        error: `Nilai "${jenis}" sudah ada untuk siswa ini di mapel ${mapel.nama_mapel} semester ${data.semester}`
      }, { status: 400 })
    }

    const nilai = await prisma.nilai.create({
      data: {
        ...data,
        jenis,
        tahunPelajaranId: activeTP,
        tanggal: tanggal ? new Date(tanggal) : new Date()
      }
    })

    await logActivity(session.user.id, 'INPUT_NILAI', `Input ${jenis} for ${siswa.nama} - ${mapel.nama_mapel}`)
    
    return NextResponse.json({ data: nilai }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'GURU'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, nilai: newNilai } = body

    if (!id || newNilai === undefined) {
      return NextResponse.json({ error: 'ID dan nilai harus diisi' }, { status: 400 })
    }

    const updated = await prisma.nilai.update({
      where: { id },
      data: { nilai: newNilai }
    })

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 })

    await prisma.nilai.delete({ where: { id } })
    return NextResponse.json({ message: 'Nilai berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
