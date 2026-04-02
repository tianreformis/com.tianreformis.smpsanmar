'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Kelas { id: string; nama_kelas: string }
interface Mapel {
  id: string
  nama_mapel: string
  semester: string
  kelas?: Kelas
  tahunPelajaranId: string
}

interface PaginationState {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function MapelPage() {
  const [data, setData] = useState<Mapel[]>([])
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [tahunPelajaran, setTahunPelajaran] = useState<{ id: string; tahun: string }[]>([])
  const [activeTP, setActiveTP] = useState<string>('')
  const [filterTP, setFilterTP] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [perPage, setPerPage] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ nama_mapel: '', kelasId: '', semester: 'Ganjil' })
  const [filterSemester, setFilterSemester] = useState('')
  const [filterKelas, setFilterKelas] = useState<string>('all')
  const semesterOptions = ['Ganjil', 'Genap']

  useEffect(() => {
    fetchTahunPelajaran()
  }, [])

  useEffect(() => { fetchData(); fetchKelas() }, [pagination.page, perPage, filterTP, filterSemester, filterKelas])

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = `/api/mapel?page=${pagination.page}&limit=${perPage}`
      if (filterTP && filterTP !== 'all') url += `&tahunPelajaranId=${filterTP}`
      if (filterSemester) url += `&semester=${filterSemester}`
      if (filterKelas && filterKelas !== 'all') url += `&kelasId=${filterKelas}`
      const res = await fetch(url)
      const json = await res.json()
      setData(json.data || [])
      setPagination(json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 })
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchKelas = async () => {
    try {
      const tpParam = filterTP && filterTP !== 'all' ? filterTP : activeTP
      const res = await fetch(`/api/kelas?limit=100${tpParam ? `&tahunPelajaranId=${tpParam}` : ''}`)
      const json = await res.json()
      setKelas(json.data || [])
    } catch { console.error('Error fetching kelas') }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingId ? `/api/mapel/${editingId}` : '/api/mapel'
    const method = editingId ? 'PUT' : 'POST'
    const tpParam = filterTP && filterTP !== 'all' ? filterTP : activeTP

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tahunPelajaranId: tpParam })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Berhasil update' : 'Berhasil tambah')
        setIsModalOpen(false)
        resetForm()
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleEdit = (mapel: Mapel) => {
    setEditingId(mapel.id)
    setForm({ nama_mapel: mapel.nama_mapel, kelasId: mapel.kelas?.id || '', semester: mapel.semester || 'Ganjil' })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus?')) return
    try {
      await fetch(`/api/mapel/${id}`, { method: 'DELETE' })
      toast.success('Berhasil hapus')
      fetchData()
    } catch { toast.error('Gagal hapus') }
  }

  const resetForm = () => { setEditingId(null); setForm({ nama_mapel: '', kelasId: '', semester: 'Ganjil' }) }

  const handlePerPageChange = (val: string) => {
    const num = parseInt(val)
    setPerPage(num)
    setPagination(p => ({ ...p, page: 1 }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Mapel</h2>
          <p className="text-muted-foreground">Kelola mata pelajaran per kelas</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Mapel
        </Button>
      </div>

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
            <span className="text-sm text-muted-foreground">Kelas:</span>
            <Select value={filterKelas} onValueChange={(v) => { setFilterKelas(v); setPagination(p => ({ ...p, page: 1 })) }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
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
        <span className="text-sm text-muted-foreground">Total: {pagination.total} mapel</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Mata Pelajaran</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : data.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
          ) : data.map((mapel, i) => (
            <TableRow key={mapel.id}>
              <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
              <TableCell className="font-medium">{mapel.nama_mapel}</TableCell>
              <TableCell><Badge variant="outline">{mapel.kelas?.nama_kelas || '-'}</Badge></TableCell>
              <TableCell><Badge variant={mapel.semester === 'Ganjil' ? 'default' : 'secondary'}>{mapel.semester}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(mapel)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(mapel.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && (
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

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) { setIsModalOpen(false); resetForm() } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Mapel' : 'Tambah Mapel'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Input value={form.nama_mapel} onChange={(e) => setForm({ ...form, nama_mapel: e.target.value })} placeholder="Contoh: Matematika" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Select value={form.kelasId} onValueChange={(v) => setForm({ ...form, kelasId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                    <SelectContent>
                      {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ganjil">Ganjil</SelectItem>
                      <SelectItem value="Genap">Genap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }}>Batal</Button>
              <Button type="submit">{editingId ? 'Update' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
