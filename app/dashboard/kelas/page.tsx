'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Guru { id: string; nama: string }
interface Kelas {
  id: string
  nama_kelas: string
  waliKelas?: Guru
  _count: { siswa: number }
}

interface PaginationState {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function KelasPage() {
  const [data, setData] = useState<Kelas[]>([])
  const [guru, setGuru] = useState<Guru[]>([])
  const [tahunPelajaran, setTahunPelajaran] = useState<{ id: string; tahun: string }[]>([])
  const [activeTP, setActiveTP] = useState<string>('')
  const [filterTP, setFilterTP] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [perPage, setPerPage] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ nama_kelas: '', waliKelasId: '' })

  useEffect(() => { fetchData(); fetchGuru(); fetchTahunPelajaran() }, [pagination.page, perPage, filterTP])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/kelas?page=${pagination.page}&limit=${perPage}${filterTP ? `&tahunPelajaranId=${filterTP}` : ''}`)
      const json = await res.json()
      setData(json.data || [])
      setPagination(json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 })
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchGuru = async () => {
    try {
      const res = await fetch('/api/guru?limit=100')
      const json = await res.json()
      setGuru(json.data)
    } catch { console.error('Error fetching guru') }
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
    const url = editingId ? `/api/kelas/${editingId}` : '/api/kelas'
    const method = editingId ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Berhasil update' : 'Berhasil tambah')
        setIsModalOpen(false)
        resetForm()
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleEdit = (kelas: Kelas) => {
    setEditingId(kelas.id)
    setForm({ nama_kelas: kelas.nama_kelas, waliKelasId: kelas.waliKelas?.id || '' })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus?')) return
    try {
      await fetch(`/api/kelas/${id}`, { method: 'DELETE' })
      toast.success('Berhasil hapus')
      fetchData()
    } catch { toast.error('Gagal hapus') }
  }

  const resetForm = () => { setEditingId(null); setForm({ nama_kelas: '', waliKelasId: '' }) }

  const handlePerPageChange = (val: string) => {
    const num = parseInt(val)
    setPerPage(num)
    setPagination(p => ({ ...p, page: 1 }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Kelas</h2>
          <p className="text-muted-foreground">Kelola data kelas</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Kelas
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
                <SelectItem value="">Semua</SelectItem>
                {tahunPelajaran.map(tp => <SelectItem key={tp.id} value={tp.id}>{tp.tahun}{tp.id === activeTP ? ' (Aktif)' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">Total: {pagination.total} kelas</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Nama Kelas</TableHead>
            <TableHead>Wali Kelas</TableHead>
            <TableHead>Jumlah Siswa</TableHead>
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
          ) : data.map((kelas, i) => (
            <TableRow key={kelas.id}>
              <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
              <TableCell className="font-medium">{kelas.nama_kelas}</TableCell>
              <TableCell>{kelas.waliKelas?.nama || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {kelas._count.siswa} siswa
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(kelas)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(kelas.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Nama Kelas</Label><Input value={form.nama_kelas} onChange={(e) => setForm({ ...form, nama_kelas: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Wali Kelas</Label>
                <Select value={form.waliKelasId} onValueChange={(v) => setForm({ ...form, waliKelasId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Wali Kelas" /></SelectTrigger>
                  <SelectContent>{guru.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit">{editingId ? 'Update' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
