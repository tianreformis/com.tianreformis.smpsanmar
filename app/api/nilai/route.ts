import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nilaiSchema, nilaiFilterSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { formatZodErrors } from '@/lib/error-handler'

async function getSessionAndValidate() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session }
}

async function validateFilterParams(searchParams: URLSearchParams) {
  const tahunPelajaranId = searchParams.get('tahunPelajaranId')
  const semester = searchParams.get('semester')

  if (!tahunPelajaranId || !semester) {
    return {
      error: NextResponse.json(
        { error: 'tahunPelajaranId dan semester wajib dipilih sebelum mengakses data nilai' },
        { status: 400 }
      )
    }
  }

  const filterResult = nilaiFilterSchema.safeParse({ tahunPelajaranId, semester })
  if (!filterResult.success) {
    return {
      error: NextResponse.json(
        { error: 'tahunPelajaranId dan semester tidak valid' },
        { status: 400 }
      )
    }
  }

  const tp = await prisma.tahunPelajaran.findUnique({ where: { id: tahunPelajaranId } })
  if (!tp) {
    return {
      error: NextResponse.json({ error: 'Tahun pelajaran tidak ditemukan' }, { status: 404 })
    }
  }

  return { tahunPelajaranId, semester: semester as 'Ganjil' | 'Genap' }
}

async function getSiswaKelasMapelIds(siswaId: string, tahunPelajaranId: string) {
  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    include: { kelas: true }
  })

  if (!siswa?.kelasId) return []

  const jadwal = await prisma.jadwal.findMany({
    where: {
      kelasId: siswa.kelasId,
      tahunPelajaranId
    },
    select: { mapelId: true }
  })

  return Array.from(new Set(jadwal.map(j => j.mapelId)))
}

async function getGuruMapelIds(guruId: string, tahunPelajaranId?: string, semester?: string) {
  const jadwal = await prisma.jadwal.findMany({
    where: {
      guruId,
      ...(tahunPelajaranId && { tahunPelajaranId }),
      ...(semester && { semester })
    },
    select: { mapelId: true }
  })
  return Array.from(new Set(jadwal.map(j => j.mapelId)))
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

export async function GET(req: Request) {
  try {
    const authResult = await getSessionAndValidate()
    if (authResult.error) return authResult.error
    const { session } = authResult

    const { searchParams } = new URL(req.url)

    const filterResult = await validateFilterParams(searchParams)
    if ('error' in filterResult && filterResult.error) return filterResult.error
    const { tahunPelajaranId, semester } = filterResult

    const matrix = searchParams.get('matrix') === 'true'
    const kelasId = searchParams.get('kelasId')
    const mapelId = searchParams.get('mapelId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      tahunPelajaranId,
      semester
    }

    if (kelasId) {
      const siswaIds = (await prisma.siswa.findMany({
        where: { kelasId, tahunPelajaranId },
        select: { id: true }
      })).map(s => s.id)
      if (siswaIds.length > 0) {
        where.siswaId = { in: siswaIds }
      } else {
        return NextResponse.json({
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
          message: 'Tidak ada siswa di kelas ini'
        })
      }
    }

    if (mapelId) {
      where.mapelId = mapelId
    }

    if (session.user.role === 'SISWA') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { siswa: true }
      })

      if (!user?.siswaId) {
        return NextResponse.json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } })
      }

      where.siswaId = user.siswaId

      const allowedMapelIds = await getSiswaKelasMapelIds(user.siswaId, tahunPelajaranId)
      if (allowedMapelIds.length > 0) {
        where.mapelId = { in: allowedMapelIds }
      } else {
        return NextResponse.json({
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
          message: 'Tidak ada mapel yang tersedia untuk kelas Anda'
        })
      }
    } else if (session.user.role === 'GURU') {
      const guru = await prisma.guru.findFirst({
        where: { user: { id: session.user.id } }
      })

      if (!guru) {
        return NextResponse.json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } })
      }

      const mapelIds = await getGuruMapelIds(guru.id, tahunPelajaranId, semester)

      if (mapelIds.length > 0) {
        where.mapelId = { in: mapelIds }
      } else {
        return NextResponse.json({
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
          message: 'Anda tidak mengajar di tahun pelajaran/semester ini'
        })
      }
    }

    if (matrix && ['ADMIN', 'GURU'].includes(session.user.role)) {
      const allMapelWhere: any = { tahunPelajaranId, semester }
      if (kelasId) {
        const jadwalMapelIds = (await prisma.jadwal.findMany({
          where: { kelasId, tahunPelajaranId, semester },
          select: { mapelId: true }
        })).map(j => j.mapelId)
        if (jadwalMapelIds.length > 0) {
          allMapelWhere.id = { in: jadwalMapelIds }
        }
      }
      if (mapelId) {
        allMapelWhere.id = mapelId
      }

      const allMapel = await prisma.mapel.findMany({
        where: allMapelWhere,
        select: { id: true, nama_mapel: true },
        orderBy: { nama_mapel: 'asc' }
      })

      const siswaWhere: any = { tahunPelajaranId }
      if (kelasId) siswaWhere.kelasId = kelasId

      const allSiswa = await prisma.siswa.findMany({
        where: siswaWhere,
        select: { id: true, nama: true, nisn: true },
        orderBy: { nama: 'asc' }
      })

      const nilaiList = await prisma.nilai.findMany({
        where,
        include: {
          siswa: { select: { id: true, nama: true, nisn: true } },
          mapel: { select: { id: true, nama_mapel: true } }
        },
        orderBy: [{ siswa: { nama: 'asc' } }, { mapel: { nama_mapel: 'asc' } }]
      })

      const matrixData: any = {}

      for (const s of allSiswa) {
        matrixData[s.id] = {
          siswaId: s.id,
          nama: s.nama,
          nisn: s.nisn,
          nilai: {}
        }
      }

      for (const nilai of nilaiList) {
        const siswaKey = nilai.siswa.id
        if (!matrixData[siswaKey]) {
          matrixData[siswaKey] = {
            siswaId: nilai.siswa.id,
            nama: nilai.siswa.nama,
            nisn: nilai.siswa.nisn,
            nilai: {}
          }
        }

        const mapelKey = nilai.mapel.id
        if (!matrixData[siswaKey].nilai[mapelKey]) {
          matrixData[siswaKey].nilai[mapelKey] = {
            mapelId: nilai.mapel.id,
            namaMapel: nilai.mapel.nama_mapel,
            jenis: {}
          }
        }

        matrixData[siswaKey].nilai[mapelKey].jenis[nilai.jenis] = nilai.nilai
      }

      const allJenis = ['Tugas', 'UH', 'PTS', 'PAS']

      return NextResponse.json({
        data: Object.values(matrixData),
        meta: {
          mapel: allMapel,
          jenisList: allJenis
        },
        pagination: { total: Object.keys(matrixData).length, page: 1, limit: Object.keys(matrixData).length, totalPages: 1 }
      })
    }

    const [data, total] = await Promise.all([
      prisma.nilai.findMany({
        where,
        include: {
          siswa: { select: { id: true, nama: true, nisn: true } },
          mapel: { select: { id: true, nama_mapel: true } }
        },
        skip,
        take: limit,
        orderBy: { tanggal: 'desc' }
      }),
      prisma.nilai.count({ where })
    ])

    return NextResponse.json({
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await getSessionAndValidate()
    if (authResult.error) return authResult.error
    const { session } = authResult

    if (!['ADMIN', 'GURU'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    const filterResult = await validateFilterParams(new URLSearchParams({
      tahunPelajaranId: body.tahunPelajaranId || '',
      semester: body.semester || ''
    }))
    if ('error' in filterResult && filterResult.error) return filterResult.error
    const { tahunPelajaranId, semester } = filterResult

    const { jenis, tanggal, ...rest } = body
    const validatedData = nilaiSchema.parse({ ...rest, jenis, semester })

    const mapel = await prisma.mapel.findFirst({
      where: {
        id: validatedData.mapelId,
        tahunPelajaranId,
        semester
      }
    })

    if (!mapel) {
      return NextResponse.json({
        error: `Mapel tidak ditemukan pada tahun pelajaran ${tahunPelajaranId} semester ${semester}`
      }, { status: 400 })
    }

    if (session.user.role === 'GURU') {
      const guru = await prisma.guru.findFirst({
        where: { user: { id: session.user.id } }
      })
      if (!guru) {
        return NextResponse.json({ error: 'Anda tidak mengajar mapel ini' }, { status: 403 })
      }
      const canTeach = await isGuruTeachingMapel(guru.id, validatedData.mapelId, tahunPelajaranId, semester)
      if (!canTeach) {
        return NextResponse.json({ error: 'Anda tidak mengajar mapel ini' }, { status: 403 })
      }
    }

    const siswa = await prisma.siswa.findFirst({
      where: {
        id: validatedData.siswaId,
        tahunPelajaranId
      }
    })

    if (!siswa) {
      return NextResponse.json({
        error: 'Siswa tidak terdaftar pada tahun pelajaran ini'
      }, { status: 400 })
    }

    if (siswa.kelasId) {
      const jadwalExists = await prisma.jadwal.findFirst({
        where: {
          kelasId: siswa.kelasId,
          mapelId: validatedData.mapelId,
          tahunPelajaranId
        }
      })

      if (!jadwalExists) {
        return NextResponse.json({
          error: 'Mapel ini tidak tersedia di kelas siswa'
        }, { status: 400 })
      }
    }

    const existing = await prisma.nilai.findFirst({
      where: {
        siswaId: validatedData.siswaId,
        mapelId: validatedData.mapelId,
        tahunPelajaranId,
        semester,
        jenis: validatedData.jenis
      }
    })

    if (existing) {
      return NextResponse.json({
        error: `Nilai "${validatedData.jenis}" sudah ada untuk siswa ini di mapel ${mapel.nama_mapel}`
      }, { status: 409 })
    }

    const nilai = await prisma.nilai.create({
      data: {
        siswaId: validatedData.siswaId,
        mapelId: validatedData.mapelId,
        tahunPelajaranId,
        semester,
        jenis: validatedData.jenis,
        nilai: validatedData.nilai,
        tanggal: tanggal ? new Date(tanggal) : new Date()
      },
      include: {
        siswa: { select: { id: true, nama: true } },
        mapel: { select: { id: true, nama_mapel: true } }
      }
    })

    await logActivity(
      session.user.id,
      'CREATE_NILAI',
      `Input ${nilai.jenis} untuk ${nilai.siswa.nama} - ${nilai.mapel.nama_mapel}`
    )

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
    const authResult = await getSessionAndValidate()
    if (authResult.error) return authResult.error
    const { session } = authResult

    if (!['ADMIN', 'GURU'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID nilai harus diisi' }, { status: 400 })
    }

    const existingNilai = await prisma.nilai.findUnique({
      where: { id },
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

    const filterResult = await validateFilterParams(new URLSearchParams({
      tahunPelajaranId: existingNilai.tahunPelajaranId,
      semester: existingNilai.semester
    }))
    if ('error' in filterResult && filterResult.error) return filterResult.error

    if (updateData.nilai !== undefined) {
      const nilaiValidation = z.number().min(0).max(100).safeParse(updateData.nilai)
      if (!nilaiValidation.success) {
        return NextResponse.json({ error: 'Nilai harus antara 0-100' }, { status: 400 })
      }
    }

    const updated = await prisma.nilai.update({
      where: { id },
      data: {
        ...(updateData.nilai !== undefined && { nilai: updateData.nilai }),
        ...(updateData.jenis && { jenis: updateData.jenis }),
        ...(updateData.tanggal && { tanggal: new Date(updateData.tanggal) })
      },
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodErrors(error) }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await getSessionAndValidate()
    if (authResult.error) return authResult.error
    const { session } = authResult

    if (!['ADMIN', 'GURU'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const siswaId = searchParams.get('siswaId')
    const mapelId = searchParams.get('mapelId')
    const jenis = searchParams.get('jenis')

    let existingNilai: any

    if (id) {
      existingNilai = await prisma.nilai.findUnique({
        where: { id },
        include: { mapel: true, siswa: true }
      })
    } else if (siswaId && mapelId && jenis) {
      const filterResult = await validateFilterParams(searchParams)
      if ('error' in filterResult && filterResult.error) return filterResult.error
      const { tahunPelajaranId, semester } = filterResult

      existingNilai = await prisma.nilai.findFirst({
        where: { siswaId, mapelId, jenis, tahunPelajaranId, semester },
        include: { mapel: true, siswa: true }
      })
    }

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

    if (!id) {
      const filterResult = await validateFilterParams(searchParams)
      if ('error' in filterResult && filterResult.error) return filterResult.error
    }

    await prisma.nilai.delete({ where: { id: existingNilai.id } })

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
