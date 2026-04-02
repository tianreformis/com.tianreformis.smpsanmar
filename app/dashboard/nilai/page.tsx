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
interface Nilai {
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
  const [data, setData] = useState<Nilai[]>([])
  const [siswa, setSiswa] = useState<Option[]>([])
  const [mapel, setMapel] = useState<Option[]>([])
  const [tahunPelajaran, setTahunPelajaran] = useState<{ id: string; tahun: string }[]>([])
  const [activeTP, setActiveTP] = useState<string>('')
  const [filterTP, setFilterTP] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [perPage, setPerPage] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ siswaId: '', mapelId: '', nilai: '', semester: '', jenis: '', tanggal: '' })
  const [filterSemester, setFilterSemester] = useState('')
  const [rerata, setRerata] = useState<{ semester: string; nilai: number }[]>([])
  const [guruMapel, setGuruMapel] = useState<string[]>([])

  const isAdmin = session?.user?.role === 'ADMIN'
  const isGuru = session?.user?.role === 'GURU'
  const isSiswa = session?.user?.role === 'SISWA'

  const semesterOptions = ['Ganjil', 'Genap']
  const jenisOptions = ['Tugas 1', 'Tugas 2', 'Tugas 3', 'UH 1', 'UH 2', 'UTS', 'UAS']

  useEffect(() => {
    fetchTahunPelajaran()
    if (isGuru) fetchGuruMapel()
  }, [])

  useEffect(() => { fetchData(); fetchOptions() }, [pagination.page, perPage, filterSemester, filterTP])

  const fetchGuruMapel = async () => {
    try {
      const res = await fetch('/api/mapel?limit=100')
      const json = await res.json()
      setGuruMapel((json.data || []).map((m: any) => m.id))
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
      }
    } catch (e) { console.error('Error fetching tahun pelajaran') }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = `/api/nilai?page=${pagination.page}&limit=${perPage}`
      if (filterSemester) url += `&semester=${filterSemester}`
      if (filterTP && filterTP !== 'all') url += `&tahunPelajaranId=${filterTP}`
      const res = await fetch(url)
      const json = await res.json()
      setData(json.data || [])
      setPagination(json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 })
      calculateRerata(json.data)
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchOptions = async () => {
    const tpParam = filterTP && filterTP !== 'all' ? filterTP : activeTP
    const [s, m] = await Promise.all([
      fetch(`/api/siswa?limit=100${tpParam ? `&tahunPelajaranId=${tpParam}` : ''}`).then(r => r.json()),
      fetch(`/api/mapel?limit=100${tpParam ? `&tahunPelajaranId=${tpParam}` : ''}`).then(r => r.json())
    ])
    setSiswa(s.data.map((x: any) => ({ id: x.id, label: x.nama })))
    setMapel(m.data.map((x: any) => ({ id: x.id, label: `${x.nama_mapel} (${x.semester})` })))
  }

  const calculateRerata = (nilaiData: Nilai[]) => {
    if (!nilaiData) return
    const bySemester: Record<string, number[]> = {}
    nilaiData.forEach(n => {
      if (!bySemester[n.semester]) bySemester[n.semester] = []
      bySemester[n.semester].push(n.nilai)
    })
    setRerata(Object.entries(bySemester).map(([semester, nilai]) => ({
      semester,
      nilai: nilai.reduce((a, b) => a + b, 0) / nilai.length
    })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? '/api/nilai' : '/api/nilai'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, nilai: parseFloat(form.nilai) } : { ...form, nilai: parseFloat(form.nilai) })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Nilai berhasil diupdate' : 'Nilai berhasil disimpan')
        setIsModalOpen(false)
        setEditingId(null)
        setForm({ siswaId: '', mapelId: '', nilai: '', semester: '', jenis: '', tanggal: '' })
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleEdit = (nilai: Nilai) => {
    setEditingId(nilai.id)
    setForm({
      siswaId: '',
      mapelId: '',
      nilai: String(nilai.nilai),
      semester: nilai.semester,
      jenis: nilai.jenis,
      tanggal: ''
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

  const handlePerPageChange = (val: string) => {
    const num = parseInt(val)
    setPerPage(num)
    setPagination(p => ({ ...p, page: 1 }))
  }

  const canEditDelete = (nilai: Nilai) => {
    if (isAdmin) return true
    if (isGuru) return guruMapel.includes(nilai.mapel.id || '')
    return false
  }

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
          <Button onClick={() => { setEditingId(null); setForm({ siswaId: '', mapelId: '', nilai: '', semester: '', jenis: '', tanggal: '' }); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> {isGuru ? 'Input Nilai' : 'Input Nilai'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rerata.map(r => (
          <Card key={r.semester}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Semester {r.semester}</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{r.nilai.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Rata-rata nilai</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isSiswa && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tampilkan</span>
              <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per halaman</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tahun Pelajaran:</span>
              <Select value={filterTP} onValueChange={(v) => { setFilterTP(v); setPagination(p => ({ ...p, page: 1 })) }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {tahunPelajaran.map(tp => <SelectItem key={tp.id} value={tp.id}>{tp.tahun}{tp.id === activeTP ? ' (Aktif)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Semester:</span>
              <Select value={filterSemester || 'all'} onValueChange={(v) => { setFilterSemester(v === 'all' ? '' : v); setPagination(p => ({ ...p, page: 1 })) }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {semesterOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
            <TableHead>Semester</TableHead>
            <TableHead>Tanggal</TableHead>
            {!isSiswa && <TableHead>Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(isSiswa ? 6 : 8)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : data.length === 0 ? (
            <TableRow><TableCell colSpan={isSiswa ? 6 : 8} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
          ) : data.map((nilai, i) => (
            <TableRow key={nilai.id}>
              <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
              {!isSiswa && <TableCell className="font-medium">{nilai.siswa.nama}</TableCell>}
              <TableCell>{nilai.mapel.nama_mapel}</TableCell>
              <TableCell><Badge variant="outline">{nilai.jenis}</Badge></TableCell>
              <TableCell className="font-bold">{nilai.nilai}</TableCell>
              <TableCell><Badge variant={nilai.semester === 'Ganjil' ? 'default' : 'secondary'}>{nilai.semester}</Badge></TableCell>
              <TableCell className="text-sm">{new Date(nilai.tanggal).toLocaleDateString('id-ID')}</TableCell>
              {!isSiswa && (
                <TableCell>
                  <div className="flex gap-2">
                    {canEditDelete(nilai) && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(nilai)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(nilai.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
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
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) pageNum = i + 1
              else if (pagination.page <= 3) pageNum = i + 1
              else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
              else pageNum = pagination.page - 2 + i
              return (
                <Button key={pageNum} variant={pagination.page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setPagination(p => ({ ...p, page: pageNum }))}>{pageNum}</Button>
              )
            })}
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}

      {!isSiswa && (
        <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) { setIsModalOpen(false); setEditingId(null) } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit Nilai' : 'Input Nilai'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {!editingId && (
                  <>
                    <div className="space-y-2">
                      <Label>Siswa</Label>
                      <Select value={form.siswaId} onValueChange={(v) => setForm({ ...form, siswaId: v })}>
                        <SelectTrigger><SelectValue placeholder="Pilih Siswa" /></SelectTrigger>
                        <SelectContent>{siswa.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mapel</Label>
                      <Select value={form.mapelId} onValueChange={(v) => setForm({ ...form, mapelId: v })}>
                        <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                        <SelectContent>{mapel.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
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
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jenis Nilai</Label>
                        <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v })}>
                          <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                          <SelectContent>{jenisOptions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nilai</Label>
                        <Input type="number" min="0" max="100" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Semester</Label>
                        <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
                          <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                          <SelectContent>{semesterOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
                      </div>
                    </div>
                  </>
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
