'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus, Search, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Siswa {
  id: string
  nisn: string
  nama: string
  jenis_kelamin: string
  tanggal_lahir: string
  alamat: string
  no_hp: string
  kelas?: { nama_kelas: string }
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FormData {
  nisn: string
  nama: string
  jenis_kelamin: string
  tanggal_lahir: string
  alamat: string
  no_hp: string
  kelasId: string
}

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([])
  const [kelas, setKelas] = useState<{ id: string; nama_kelas: string }[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    nisn: '', nama: '', jenis_kelamin: '', tanggal_lahir: '', alamat: '', no_hp: '', kelasId: ''
  })

  useEffect(() => {
    fetchData()
    fetchKelas()
  }, [pagination.page, search])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/siswa?page=${pagination.page}&limit=${pagination.limit}&search=${search}`)
      const json = await res.json()
      setData(json.data)
      setPagination(json.pagination)
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchKelas = async () => {
    try {
      const res = await fetch('/api/kelas')
      const json = await res.json()
      setKelas(json.data)
    } catch { console.error('Error fetching kelas') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingId ? `/api/siswa/${editingId}` : '/api/siswa'
    const method = editingId ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kelasId: form.kelasId || undefined })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Berhasil update' : 'Berhasil tambah')
        setIsModalOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(json.error || 'Gagal menyimpan')
      }
    } catch (err: any) { toast.error(err.message || 'Terjadi kesalahan') }
  }

  const handleEdit = (siswa: Siswa) => {
    setEditingId(siswa.id)
    const tgl = siswa.tanggal_lahir.includes('T') ? siswa.tanggal_lahir.split('T')[0] : siswa.tanggal_lahir
    setForm({
      nisn: siswa.nisn,
      nama: siswa.nama,
      jenis_kelamin: siswa.jenis_kelamin,
      tanggal_lahir: tgl,
      alamat: siswa.alamat,
      no_hp: siswa.no_hp,
      kelasId: siswa.kelas?.id || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus?')) return
    try {
      const res = await fetch(`/api/siswa/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        toast.success('Berhasil hapus')
        fetchData()
      } else {
        toast.error(json.error || 'Gagal hapus')
      }
    } catch (err: any) { toast.error(err.message || 'Gagal hapus') }
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ nisn: '', nama: '', jenis_kelamin: '', tanggal_lahir: '', alamat: '', no_hp: '', kelasId: '' })
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(s => ({
      NISN: s.nisn, Nama: s.nama, 'Jenis Kelamin': s.jenis_kelamin,
      'Tanggal Lahir': s.tanggal_lahir, Alamat: s.alamat, 'No HP': s.no_hp,
      Kelas: s.kelas?.nama_kelas || '-'
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa')
    XLSX.writeFile(wb, 'data-siswa.xlsx')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Data Siswa', 14, 10)
    doc.autoTable({
      head: [['NISN', 'Nama', 'JK', 'Kelas', 'Alamat']],
      body: data.map(s => [s.nisn, s.nama, s.jenis_kelamin, s.kelas?.nama_kelas || '-', s.alamat])
    })
    doc.save('data-siswa.pdf')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Siswa</h2>
          <p className="text-muted-foreground">Kelola data siswa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}><Download className="h-4 w-4 mr-2" /> Excel</Button>
          <Button variant="outline" onClick={exportPDF}><Download className="h-4 w-4 mr-2" /> PDF</Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Siswa
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama atau NISN..." className="pl-10" value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>JK</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
              </TableRow>
            )) : data.map((siswa, i) => (
              <TableRow key={siswa.id}>
                <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
                <TableCell className="font-mono">{siswa.nisn}</TableCell>
                <TableCell className="font-medium">{siswa.nama}</TableCell>
                <TableCell><Badge variant={siswa.jenis_kelamin === 'L' ? 'default' : 'secondary'}>{siswa.jenis_kelamin}</Badge></TableCell>
                <TableCell>{siswa.kelas?.nama_kelas || '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{siswa.alamat}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(siswa)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(siswa.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total: {pagination.total} siswa</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
          <span className="px-4 py-2">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>NISN</Label>
                  <Input value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select value={form.jenis_kelamin} onValueChange={(v) => setForm({ ...form, jenis_kelamin: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>No HP</Label>
                  <Input value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} required />
                </div>
              </div>
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
                <Label>Alamat</Label>
                <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required />
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
