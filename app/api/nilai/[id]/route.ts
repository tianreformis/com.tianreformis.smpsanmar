import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

async function getSessionAndValidate() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session }
}

async function isGuruTeachingMapel(guruId: string, mapelId: string, tahunPelajaranId?: string, semester?: string) {
  const jadwal = await prisma.jadwal.findFirst({
    where: {
      guruId,
      mapelId,
      ...(tahunPelajaranId && { tahunPelajaranId }),
      ...(semester && { semester })
    }
  })
  return !!jadwal
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await getSessionAndValidate()
    if (authResult.error) return authResult.error
    const { session } = authResult

    const nilai = await prisma.nilai.findUnique({
      where: { id: params.id },
      include: {
        siswa: { select: { id: true, nama: true, nisn: true } },
        mapel: { select: { id: true, nama_mapel: true } },
        tahunPelajaran: { select: { id: true, tahun: true } }
      }
    })

    if (!nilai) {
      return NextResponse.json({ error: 'Nilai tidak ditemukan' }, { status: 404 })
    }

    if (session.user.role === 'SISWA') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { siswa: true }
      })

      if (!user?.siswaId || nilai.siswaId !== user.siswaId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.user.role === 'GURU') {
      const guru = await prisma.guru.findFirst({
        where: { user: { id: session.user.id } }
      })
      if (!guru || !await isGuruTeachingMapel(guru.id, nilai.mapelId, nilai.tahunPelajaranId, nilai.semester)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ data: nilai })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions))
    if (!session || !['ADMIN', 'GURU'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { nilai: newNilai, jenis, tanggal } = body

    const existingNilai = await prisma.nilai.findUnique({
      where: { id: params.id },
      include: { mapel: true, siswa: true }
    })

    if (!existingNilai) {
      return NextResponse.json({ error: 'Nilai tidak ditemukan' }, { status: 404 })
    }

    if (session.user.role === 'GURU') {
      const guru = await prisma.guru.findFirst({
        where: { user: { id: session.user.id } }
      })
      if (!guru || !await isGuruTeachingMapel(guru.id, existingNilai.mapelId, existingNilai.tahunPelajaranId, existingNilai.semester)) {
        return NextResponse.json({ error: 'Anda tidak mengajar mapel ini' }, { status: 403 })
      }
    }

    const updateData: any = {}
    if (newNilai !== undefined) {
      const val = Number(newNilai)
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json({ error: 'Nilai harus antara 0-100' }, { status: 400 })
      }
      updateData.nilai = val
    }
    if (jenis) updateData.jenis = jenis
    if (tanggal) updateData.tanggal = new Date(tanggal)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diubah' }, { status: 400 })
    }

    const updated = await prisma.nilai.update({
      where: { id: params.id },
      data: updateData,
      include: {
        siswa: { select: { id: true, nama: true } },
        mapel: { select: { id: true, nama_mapel: true } }
      }
    })

    await logActivity(
      session.user.id,
      'UPDATE_NILAI',
      `Update ${updated.jenis} untuk ${updated.siswa.nama} - ${updated.mapel.nama_mapel}`
    )

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions))
    if (!session || !['ADMIN', 'GURU'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const existingNilai = await prisma.nilai.findUnique({
      where: { id: params.id },
      include: { mapel: true, siswa: true }
    })

    if (!existingNilai) {
      return NextResponse.json({ error: 'Nilai tidak ditemukan' }, { status: 404 })
    }

    if (session.user.role === 'GURU') {
      const guru = await prisma.guru.findFirst({
        where: { user: { id: session.user.id } }
      })
      if (!guru || !await isGuruTeachingMapel(guru.id, existingNilai.mapelId, existingNilai.tahunPelajaranId, existingNilai.semester)) {
        return NextResponse.json({ error: 'Anda tidak mengajar mapel ini' }, { status: 403 })
      }
    }

    await prisma.nilai.delete({ where: { id: params.id } })

    await logActivity(
      session.user.id,
      'DELETE_NILAI',
      `Hapus ${existingNilai.jenis} untuk ${existingNilai.siswa.nama} - ${existingNilai.mapel.nama_mapel}`
    )

    return NextResponse.json({ message: 'Nilai berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
