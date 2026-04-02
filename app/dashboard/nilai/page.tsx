'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Calculator, Trash2, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Option { id: string; label: string }
interface MapelMeta { id: string; nama_mapel: string }

interface SiswaNilai {
  siswaId: string
  nama: string
  nisn: string
  nilai: Record<string, {
    mapelId: string
    namaMapel: string
    jenis: Record<string, number>
  }>
}

interface MatrixResponse {
  data: SiswaNilai[]
  meta: {
    mapel: MapelMeta[]
    jenisList: string[]
  }
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

interface NilaiRow {
  id: string
  nilai: number
  semester: string
  jenis: string
  tanggal: string
  siswa: { nama: string }
  mapel: { id: string; nama_mapel: string; guruId?: string }
}

interface PaginationState {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function NilaiPage() {
  const { data: session } = useSession()
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix')
  const [matrixData, setMatrixData] = useState<SiswaNilai[]>([])
  const [matrixMeta, setMatrixMeta] = useState<{ mapel: MapelMeta[]; jenisList: string[] }>({ mapel: [], jenisList: [] })
  const [listData, setListData] = useState<NilaiRow[]>([])
  const [siswa, setSiswa] = useState<Option[]>([])
  const [kelas, setKelas] = useState<Option[]>([])
  const [mapel, setMapel] = useState<Option[]>([])
  const [tahunPelajaran, setTahunPelajaran] = useState<{ id: string; tahun: string }[]>([])
  const [activeTP, setActiveTP] = useState<string>('')
  const [filterTP, setFilterTP] = useState<string>('')
  const [filterSemester, setFilterSemester] = useState('Ganjil')
  const [filterKelas, setFilterKelas] = useState<string>('')
  const [filterMapel, setFilterMapel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [perPage, setPerPage] = useState(20)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ siswaId: '', mapelId: '', nilai: '', semester: 'Ganjil', jenis: '', tanggal: '', tahunPelajaranId: '', kelasId: '' })
  const [formMapelOptions, setFormMapelOptions] = useState<Option[]>([])
  const [formSiswaOptions, setFormSiswaOptions] = useState<Option[]>([])
  const [rerata, setRerata] = useState<{ jenis: string; nilai: number }[]>([])
  const [guruMapelIds, setGuruMapelIds] = useState<string[]>([])

  const isAdmin = session?.user?.role === 'ADMIN'
  const isGuru = session?.user?.role === 'GURU'
  const isSiswa = session?.user?.role === 'SISWA'

  const semesterOptions = ['Ganjil', 'Genap']
  const jenisPresetOptions = ['Tugas', 'UH', 'PTS', 'PAS']

  useEffect(() => {
    fetchTahunPelajaran()
    if (isGuru) fetchGuruMapel()
  }, [])

  useEffect(() => {
    if (filterTP && filterSemester) {
      fetchData()
      fetchOptions()
    }
  }, [filterTP, filterSemester, filterKelas, filterMapel, pagination.page, perPage, viewMode])

  useEffect(() => {
    const tpId = form.tahunPelajaranId || activeTP
    if (!tpId) return
    const fetchFormOptions = async () => {
      const kelasParam = form.kelasId || ''
      const [sRes, mRes] = await Promise.all([
        fetch(`/api/siswa?limit=500&tahunPelajaranId=${tpId}${kelasParam ? `&kelasId=${kelasParam}` : ''}`),
        fetch(`/api/mapel?limit=100&tahunPelajaranId=${tpId}${form.semester ? `&semester=${form.semester}` : ''}${kelasParam ? `&kelasId=${kelasParam}` : ''}`)
      ])
      const sJson = await sRes.json()
      const mJson = await mRes.json()
      setFormSiswaOptions(sJson.data?.map((x: any) => ({ id: x.id, label: x.nama })) || [])
      setFormMapelOptions(mJson.data?.map((x: any) => ({ id: x.id, label: x.nama_mapel })) || [])
    }
    fetchFormOptions()
  }, [form.tahunPelajaranId, form.semester, form.kelasId, activeTP])

  const fetchGuruMapel = async () => {
    try {
      const tpParam = activeTP
      const res = await fetch(`/api/mapel?limit=100${tpParam ? `&tahunPelajaranId=${tpParam}` : ''}`)
      const json = await res.json()
      setGuruMapelIds((json.data || []).map((m: any) => m.id))
    } catch { console.error('Error fetching guru mapel') }
  }

  const fetchTahunPelajaran = async () => {
    try {
      const res = await fetch('/api/tahun-pelajaran')
      const json = await res.json()
      setTahunPelajaran(json.data || [])
      const active = json.data?.find((tp: any) => tp.isActive)
      if (active) {
        setActiveTP(active.id)
        setFilterTP(active.id)
        setForm(f => ({ ...f, tahunPelajaranId: active.id }))
      }
    } catch (e) { console.error('Error fetching tahun pelajaran') }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const tpParam = filterTP || activeTP
      const semParam = filterSemester || 'Ganjil'
      if (!tpParam) {
        setLoading(false)
        return
      }

      if (viewMode === 'matrix' && !isSiswa) {
        let url = `/api/nilai?matrix=true&tahunPelajaranId=${tpParam}&semester=${semParam}`
        if (filterKelas && filterKelas !== 'all') url += `&kelasId=${filterKelas}`
        if (filterMapel && filterMapel !== 'all') url += `&mapelId=${filterMapel}`
        const res = await fetch(url)
        if (res.status === 400) {
          const json = await res.json()
          toast.error(json.error || 'Pilih tahun pelajaran dan semester terlebih dahulu')
          setMatrixData([])
          setMatrixMeta({ mapel: [], jenisList: [] })
          setLoading(false)
          return
        }
        const json: MatrixResponse = await res.json()
        setMatrixData(json.data || [])
        setMatrixMeta(json.meta || { mapel: [], jenisList: [] })
        setPagination(json.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 })
      } else {
        let url = `/api/nilai?page=${pagination.page}&limit=${perPage}&tahunPelajaranId=${tpParam}&semester=${semParam}`
        if (filterKelas && filterKelas !== 'all') url += `&kelasId=${filterKelas}`
        if (filterMapel && filterMapel !== 'all') url += `&mapelId=${filterMapel}`
        const res = await fetch(url)
        if (res.status === 400) {
          const json = await res.json()
          toast.error(json.error || 'Pilih tahun pelajaran dan semester terlebih dahulu')
          setListData([])
          setPagination({ total: 0, page: 1, limit: perPage, totalPages: 0 })
          setLoading(false)
          return
        }
        const json = await res.json()
        setListData(json.data || [])
        setPagination(json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 })
        calculateRerataList(json.data)
      }
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchOptions = async () => {
    const tpParam = filterTP || activeTP
    const kelasParam = filterKelas && filterKelas !== 'all' ? filterKelas : ''
    const [k, s, m] = await Promise.all([
      fetch(`/api/kelas?limit=100${tpParam ? `&tahunPelajaranId=${tpParam}` : ''}`).then(r => r.json()),
      fetch(`/api/siswa?limit=100${tpParam ? `&tahunPelajaranId=${tpParam}` : ''}${kelasParam ? `&kelasId=${kelasParam}` : ''}`).then(r => r.json()),
      fetch(`/api/mapel?limit=100${tpParam ? `&tahunPelajaranId=${tpParam}` : ''}${filterSemester ? `&semester=${filterSemester}` : ''}${kelasParam ? `&kelasId=${kelasParam}` : ''}`).then(r => r.json())
    ])
    setKelas(k.data.map((x: any) => ({ id: x.id, label: x.nama_kelas })))
    setSiswa(s.data.map((x: any) => ({ id: x.id, label: x.nama })))
    setMapel(m.data.map((x: any) => ({ id: x.id, label: x.nama_mapel })))
  }

  const calculateRerataList = (nilaiData: NilaiRow[]) => {
    if (!nilaiData) return
    const byJenis: Record<string, number[]> = {}
    nilaiData.forEach(n => {
      if (!byJenis[n.jenis]) byJenis[n.jenis] = []
      byJenis[n.jenis].push(n.nilai)
    })
    setRerata(Object.entries(byJenis).map(([jenis, nilai]) => ({
      jenis,
      nilai: nilai.reduce((a, b) => a + b, 0) / nilai.length
    })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tpParam = form.tahunPelajaranId || activeTP
    if (!tpParam) {
      toast.error('Pilih tahun pelajaran terlebih dahulu')
      return
    }
    if (!form.semester) {
      toast.error('Pilih semester')
      return
    }
    if (!form.kelasId) {
      toast.error('Pilih kelas')
      return
    }
    if (!form.mapelId) {
      toast.error('Pilih mapel')
      return
    }
    if (!form.siswaId) {
      toast.error('Pilih siswa')
      return
    }
    try {
      const url = '/api/nilai'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId
          ? { id: editingId, nilai: parseFloat(form.nilai) }
          : { ...form, tahunPelajaranId: tpParam, nilai: parseFloat(form.nilai) }
        )
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Nilai berhasil diupdate' : 'Nilai berhasil disimpan')
        setIsModalOpen(false)
        setEditingId(null)
            setForm({ siswaId: '', mapelId: '', nilai: '', semester: filterSemester, jenis: '', tanggal: '', tahunPelajaranId: '', kelasId: '' })
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleEdit = (row: NilaiRow) => {
    setEditingId(row.id)
    setForm({
      siswaId: '',
      mapelId: '',
      nilai: String(row.nilai),
      semester: row.semester,
      jenis: row.jenis,
      tanggal: '',
      tahunPelajaranId: '',
      kelasId: ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus nilai ini?')) return
    try {
      const res = await fetch(`/api/nilai?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Nilai berhasil dihapus')
        fetchData()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Gagal hapus')
      }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleDeleteMatrix = async (siswaId: string, mapelId: string, jenis: string) => {
    const nilai = matrixData.find(s => s.siswaId === siswaId)?.nilai[mapelId]?.jenis[jenis]
    if (!nilai) return
    if (!confirm(`Hapus nilai ${jenis} (${nilai})?`)) return
    try {
      const tpParam = filterTP || activeTP
      const res = await fetch(`/api/nilai?siswaId=${siswaId}&mapelId=${mapelId}&jenis=${encodeURIComponent(jenis)}&tahunPelajaranId=${tpParam}&semester=${filterSemester}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Nilai berhasil dihapus')
        fetchData()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Gagal hapus')
      }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handlePerPageChange = (val: string) => {
    const num = parseInt(val)
    setPerPage(num)
    setPagination(p => ({ ...p, page: 1 }))
  }

  const canEditDelete = (mapelId: string) => {
    if (isAdmin) return true
    if (isGuru) return guruMapelIds.includes(mapelId)
    return false
  }

  const getNilaiCell = (siswaData: SiswaNilai, mapelId: string, jenis: string) => {
    const mapelNilai = siswaData.nilai[mapelId]
    const val = mapelNilai?.jenis[jenis]
    if (val === undefined || val === null) return '-'
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="font-semibold">{val}</span>
        {canEditDelete(mapelId) && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
            onClick={() => handleDeleteMatrix(siswaData.siswaId, mapelId, jenis)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  const displayMapel = filterMapel && filterMapel !== 'all'
    ? matrixMeta.mapel.filter(m => m.id === filterMapel)
    : matrixMeta.mapel

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isSiswa ? 'Nilai Saya' : 'Manajemen Nilai'}
          </h2>
          <p className="text-muted-foreground">
            {isSiswa ? 'Lihat nilai akademik Anda' : 'Input dan kelola nilai siswa'}
          </p>
        </div>
        {!isSiswa && (
          <Button onClick={() => {
            setEditingId(null)
        setForm({ siswaId: '', mapelId: '', nilai: '', semester: filterSemester, jenis: '', tanggal: '', tahunPelajaranId: '', kelasId: '' })
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" /> Input Nilai
          </Button>
        )}
      </div>

      {viewMode === 'list' && !isSiswa && rerata.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rerata.map(r => (
            <Card key={r.jenis}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{r.jenis}</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{r.nilai.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Rata-rata</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tahun Pelajaran:</span>
          <Select value={filterTP} onValueChange={(v) => { setFilterTP(v); setFilterKelas(''); setFilterMapel(''); setPagination(p => ({ ...p, page: 1 })) }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Tahun Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              {tahunPelajaran.map(tp => (
                <SelectItem key={tp.id} value={tp.id}>
                  {tp.tahun}{tp.id === activeTP ? ' (Aktif)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Semester:</span>
          <Select value={filterSemester} onValueChange={(v) => { setFilterSemester(v); setFilterMapel(''); setPagination(p => ({ ...p, page: 1 })) }}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {semesterOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {!isSiswa && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Kelas:</span>
            <Select value={filterKelas} onValueChange={(v) => { setFilterKelas(v); setFilterMapel(''); setPagination(p => ({ ...p, page: 1 })) }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isSiswa && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mapel:</span>
            <Select value={filterMapel} onValueChange={(v) => { setFilterMapel(v); setPagination(p => ({ ...p, page: 1 })) }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua Mapel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {mapel.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isSiswa && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Tampilan:</span>
            <Select value={viewMode} onValueChange={(v: 'matrix' | 'list') => setViewMode(v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="matrix">Matriks</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {viewMode === 'matrix' && !isSiswa && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="min-w-[50px]">No</TableHead>
                <TableHead rowSpan={2} className="min-w-[200px]">Nama Siswa</TableHead>
                {displayMapel.map(m => {
                  const mapelNilai = matrixData.find(s => s.nilai[m.id])
                  const jenisKeys = mapelNilai ? Object.keys(mapelNilai.nilai[m.id]?.jenis || {}) : []
                  const colspan = Math.max(jenisKeys.length, 1)
                  return (
                    <TableHead key={m.id} colSpan={colspan} className="text-center font-bold bg-muted">
                      {m.nama_mapel}
                    </TableHead>
                  )
                })}
              </TableRow>
              <TableRow>
                {displayMapel.map(m => {
                  const mapelNilai = matrixData.find(s => s.nilai[m.id])
                  const jenisKeys = mapelNilai ? Object.keys(mapelNilai.nilai[m.id]?.jenis || {}) : []
                  if (jenisKeys.length === 0) {
                    return <TableHead key={m.id} className="text-center text-muted-foreground">-</TableHead>
                  }
                  return jenisKeys.map(jenis => (
                    <TableHead key={`${m.id}-${jenis}`} className="text-center min-w-[80px] text-xs">
                      {jenis}
                    </TableHead>
                  ))
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  {displayMapel.map(m => {
                    const mapelNilai = matrixData.find(s => s.nilai[m.id])
                    const jenisKeys = mapelNilai ? Object.keys(mapelNilai.nilai[m.id]?.jenis || {}) : []
                    return (jenisKeys.length > 0 ? jenisKeys : ['-']).map((_, j) => (
                      <TableCell key={`${m.id}-${j}`}><Skeleton className="h-4 w-16" /></TableCell>
                    ))
                  })}
                </TableRow>
              )) : matrixData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2 + displayMapel.reduce((acc, m) => {
                    const mapelNilai = matrixData.find(s => s.nilai[m.id])
                    const jenisKeys = mapelNilai ? Object.keys(mapelNilai.nilai[m.id]?.jenis || {}) : []
                    return acc + Math.max(jenisKeys.length, 1)
                  }, 0)} className="text-center py-8 text-muted-foreground">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : matrixData.map((siswaData, i) => (
                <TableRow key={siswaData.siswaId}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell className="font-medium">{siswaData.nama}</TableCell>
                  {displayMapel.map(m => {
                    const mapelNilai = siswaData.nilai[m.id]
                    const jenisKeys = mapelNilai ? Object.keys(mapelNilai.jenis) : []
                    if (jenisKeys.length === 0) {
                      return <TableCell key={m.id} className="text-center text-muted-foreground">-</TableCell>
                    }
                    return jenisKeys.map(jenis => (
                      <TableCell key={`${m.id}-${jenis}`} className="text-center">
                        {getNilaiCell(siswaData, m.id, jenis)}
                      </TableCell>
                    ))
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {viewMode === 'matrix' && !isSiswa && (
        <div className="text-sm text-muted-foreground">Total: {pagination.total} siswa</div>
      )}

      {viewMode === 'list' && (
        <>
          {!isSiswa && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per halaman</span>
              </div>
              <span className="text-sm text-muted-foreground">Total: {pagination.total} nilai</span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                {!isSiswa && <TableHead>Siswa</TableHead>}
                <TableHead>Mapel</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Tanggal</TableHead>
                {!isSiswa && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(isSiswa ? 5 : 7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              )) : listData.length === 0 ? (
                <TableRow><TableCell colSpan={isSiswa ? 5 : 7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
              ) : listData.map((nilai, i) => (
                <TableRow key={nilai.id}>
                  <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
                  {!isSiswa && <TableCell className="font-medium">{nilai.siswa.nama}</TableCell>}
                  <TableCell>{nilai.mapel.nama_mapel}</TableCell>
                  <TableCell><Badge variant="outline">{nilai.jenis}</Badge></TableCell>
                  <TableCell className="font-bold">{nilai.nilai}</TableCell>
                  <TableCell className="text-sm">{new Date(nilai.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  {!isSiswa && canEditDelete(nilai.mapel.id) && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(nilai)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(nilai.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!isSiswa && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Halaman {pagination.page} dari {pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {isSiswa && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              )) : listData.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
              ) : listData.map((nilai, i) => (
                <TableRow key={nilai.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{nilai.mapel.nama_mapel}</TableCell>
                  <TableCell><Badge variant="outline">{nilai.jenis}</Badge></TableCell>
                  <TableCell className="font-bold">{nilai.nilai}</TableCell>
                  <TableCell className="text-sm">{new Date(nilai.tanggal).toLocaleDateString('id-ID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {!isSiswa && (
        <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) { setIsModalOpen(false); setEditingId(null) } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? 'Edit Nilai' : 'Input Nilai'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {!editingId && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tahun Pelajaran</Label>
                        <Select value={form.tahunPelajaranId} onValueChange={(v) => setForm({ ...form, tahunPelajaranId: v, kelasId: '', mapelId: '', siswaId: '' })}>
                          <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                          <SelectContent>
                            {tahunPelajaran.map(tp => (
                              <SelectItem key={tp.id} value={tp.id}>
                                {tp.tahun}{tp.id === activeTP ? ' (Aktif)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Semester</Label>
                        <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v, mapelId: '', siswaId: '' })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{semesterOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kelas</Label>
                        <Select value={form.kelasId} onValueChange={(v) => setForm({ ...form, kelasId: v, mapelId: '', siswaId: '' })}>
                          <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                          <SelectContent>
                            {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mapel</Label>
                        <Select value={form.mapelId} onValueChange={(v) => setForm({ ...form, mapelId: v, siswaId: '' })}>
                          <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                          <SelectContent>
                            {formMapelOptions.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Siswa</Label>
                      <Select value={form.siswaId} onValueChange={(v) => setForm({ ...form, siswaId: v })}>
                        <SelectTrigger><SelectValue placeholder="Pilih Siswa" /></SelectTrigger>
                        <SelectContent>
                          {formSiswaOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {editingId && (
                  <div className="space-y-2">
                    <Label>Nilai Baru</Label>
                    <Input type="number" min="0" max="100" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} required />
                  </div>
                )}
                {!editingId && (
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Jenis Nilai</Label>
                      <div className="flex gap-2 mb-2">
                        {jenisPresetOptions.map(j => (
                          <Button key={j} type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, jenis: j })}>{j}</Button>
                        ))}
                      </div>
                      <Input value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} placeholder="Ketik jenis nilai (contoh: Tugas 1, UH 2)" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nilai</Label>
                        <Input type="number" min="0" max="100" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingId(null) }}>Batal</Button>
                <Button type="submit">{editingId ? 'Update' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
