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
import { Pencil, Trash2, Plus, Search, Download, Mail, ArrowRightLeft, Loader2 } from 'lucide-react'
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
  email?: string
  kelas?: { id: string; nama_kelas: string } | null
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
  email: string
}

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([])
  const [kelas, setKelas] = useState<{ id: string; nama_kelas: string }[]>([])
  const [tahunPelajaran, setTahunPelajaran] = useState<{ id: string; tahun: string }[]>([])
  const [activeTP, setActiveTP] = useState<string>('')
  const [filterTP, setFilterTP] = useState<string>('all')
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [perPage, setPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    nisn: '', nama: '', jenis_kelamin: '', tanggal_lahir: '', alamat: '', no_hp: '', kelasId: '', email: ''
  })
  const [selectedSiswa, setSelectedSiswa] = useState<Set<string>>(new Set())
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferForm, setTransferForm] = useState({ kelasId: '', tahunPelajaranId: '', catatan: '' })
  const [isTransferring, setIsTransferring] = useState(false)

  useEffect(() => {
    fetchTahunPelajaran()
  }, [])

  useEffect(() => {
    fetchData()
    fetchKelas()
  }, [pagination.page, perPage, search, filterTP])

  const fetchData = async () => {
    try {
      const url = `/api/siswa?page=${pagination.page}&limit=${perPage}&search=${search}${filterTP && filterTP !== 'all' ? `&tahunPelajaranId=${filterTP}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      const mapped = (json.data || []).map((s: any) => ({
        ...s,
        email: s.user?.email || `${s.nisn}@student.sch.id`
      }))
      setData(mapped)
      setPagination(json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 })
      setSelectedSiswa(new Set())
    } catch (e) { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchKelas = async () => {
    try {
      const res = await fetch('/api/kelas')
      const json = await res.json()
      setKelas(json.data || [])
    } catch (e) { console.error('Error fetching kelas') }
  }

  const fetchTahunPelajaran = async () => {
    try {
      const res = await fetch('/api/tahun-pelajaran')
      const json = await res.json()
      setTahunPelajaran(json.data || [])
      const active = json.data?.find((tp: any) => tp.isActive)
      if (active) setActiveTP(active.id)
    } catch (e) { console.error('Error fetching tahun pelajaran') }
  }

  const generateEmail = (nisn: string) => `${nisn}@student.sch.id`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingId ? `/api/siswa/${editingId}` : '/api/siswa'
    const method = editingId ? 'PUT' : 'POST'
    
    const payload: any = {
      nisn: form.nisn,
      nama: form.nama,
      jenis_kelamin: form.jenis_kelamin,
      tanggal_lahir: form.tanggal_lahir,
      alamat: form.alamat,
      no_hp: form.no_hp,
      kelasId: form.kelasId || null
    }

    if (editingId) {
      payload.email = form.email
    } else {
      payload.email = form.email || generateEmail(form.nisn)
    }
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Berhasil update' : 'Berhasil tambah')
        setIsModalOpen(false)
        resetForm()
        fetchData()
      } else {
        const errMsg = typeof json.error === 'string' ? json.error : JSON.stringify(json.error)
        toast.error(errMsg || 'Gagal menyimpan')
      }
    } catch (err: any) { toast.error(err.message || 'Terjadi kesalahan') }
  }

  const handleEdit = (siswa: Siswa) => {
    setEditingId(siswa.id)
    const tgl = siswa.tanggal_lahir.split('T')[0]
    setForm({
      nisn: siswa.nisn,
      nama: siswa.nama,
      jenis_kelamin: siswa.jenis_kelamin,
      tanggal_lahir: tgl,
      alamat: siswa.alamat,
      no_hp: siswa.no_hp,
      kelasId: siswa.kelas?.id || '',
      email: siswa.email || ''
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
    setForm({ nisn: '', nama: '', jenis_kelamin: '', tanggal_lahir: '', alamat: '', no_hp: '', kelasId: '', email: '' })
  }

  const handlePerPageChange = (val: string) => {
    const num = parseInt(val)
    setPerPage(num)
    setPagination(p => ({ ...p, page: 1 }))
  }

  const toggleSelect = (id: string) => {
    setSelectedSiswa(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedSiswa.size === data.length) {
      setSelectedSiswa(new Set())
    } else {
      setSelectedSiswa(new Set(data.map(s => s.id)))
    }
  }

  const handleTransfer = async () => {
    if (selectedSiswa.size === 0) { toast.error('Pilih minimal 1 siswa'); return }
    if (!transferForm.kelasId && !transferForm.tahunPelajaranId) { toast.error('Pilih kelas atau tahun pelajaran tujuan'); return }

    setIsTransferring(true)
    try {
      const res = await fetch('/api/siswa/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswaIds: Array.from(selectedSiswa),
          kelasId: transferForm.kelasId || null,
          tahunPelajaranId: transferForm.tahunPelajaranId || null,
          catatan: transferForm.catatan || null
        })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(json.message)
        setIsTransferOpen(false)
        setTransferForm({ kelasId: '', tahunPelajaranId: '', catatan: '' })
        setSelectedSiswa(new Set())
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal transfer') }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setIsTransferring(false) }
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(s => ({
      NISN: s.nisn, Nama: s.nama, Email: s.email, 'Jenis Kelamin': s.jenis_kelamin,
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
      head: [['NISN', 'Nama', 'Email', 'JK', 'Kelas', 'Alamat']],
      body: data.map(s => [s.nisn, s.nama, s.email, s.jenis_kelamin, s.kelas?.nama_kelas || '-', s.alamat])
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tahun Pelajaran:</span>
            <Select value={filterTP} onValueChange={(v) => { setFilterTP(v === 'all' ? '' : v); setPagination(p => ({ ...p, page: 1 })) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
              {tahunPelajaran.map(tp => <SelectItem key={tp.id} value={tp.id}>{tp.tahun}{tp.id === activeTP ? ' (Aktif)' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSiswa.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedSiswa.size} siswa dipilih</span>
          <Button size="sm" variant="outline" onClick={() => setIsTransferOpen(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" /> Pindah/Naik Kelas
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedSiswa(new Set())}>Batal Pilih</Button>
        </div>
      )}

      <div className="flex items-center justify-between">
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
        <span className="text-sm text-muted-foreground">Total: {pagination.total} siswa</span>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedSiswa.size === data.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead>No</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>JK</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(9)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
              </TableRow>
            )) : data.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
            ) : data.map((siswa, i) => (
              <TableRow key={siswa.id} className={selectedSiswa.has(siswa.id) ? 'bg-muted/50' : ''}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedSiswa.has(siswa.id)}
                    onChange={() => toggleSelect(siswa.id)}
                    className="h-4 w-4"
                  />
                </TableCell>
                <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
                <TableCell className="font-mono">{siswa.nisn}</TableCell>
                <TableCell className="font-medium">{siswa.nama}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[180px]">{siswa.email}</span>
                  </div>
                </TableCell>
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

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) { setIsModalOpen(false); resetForm() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>NISN</Label>
                  <Input value={form.nisn} onChange={(e) => {
                    const nisn = e.target.value
                    setForm({ ...form, nisn })
                    if (!editingId && nisn.length === 10) {
                      setForm(prev => ({ ...prev, nisn, email: generateEmail(nisn) }))
                    }
                  }} required maxLength={10} />
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
              <div className="space-y-2">
                <Label>Email Login</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={editingId ? 'Email untuk login' : 'Auto dari NISN, bisa diubah'}
                  required
                />
                {!editingId && form.nisn.length === 10 && (
                  <p className="text-xs text-muted-foreground">Auto-generated: {generateEmail(form.nisn)}</p>
                )}
                {editingId && (
                  <p className="text-xs text-muted-foreground">Password tidak bisa diubah langsung. Gunakan menu Reset Password jika perlu.</p>
                )}
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
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }}>Batal</Button>
              <Button type="submit">{editingId ? 'Update' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={(open) => { if (!open) { setIsTransferOpen(false); setTransferForm({ kelasId: '', tahunPelajaranId: '', catatan: '' }) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindah/Naik Kelas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{selectedSiswa.size} siswa akan dipindahkan</p>
            <div className="space-y-2">
              <Label>Kelas Tujuan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
              <Select value={transferForm.kelasId} onValueChange={(v) => setTransferForm({ ...transferForm, kelasId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak diubah</SelectItem>
                  {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun Pelajaran <span className="text-muted-foreground font-normal">(opsional)</span></Label>
              <Select value={transferForm.tahunPelajaranId} onValueChange={(v) => setTransferForm({ ...transferForm, tahunPelajaranId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih Tahun Pelajaran" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak diubah</SelectItem>
                  {tahunPelajaran.map(tp => <SelectItem key={tp.id} value={tp.id}>{tp.tahun}{tp.id === activeTP ? ' (Aktif)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
              <Select value={transferForm.catatan} onValueChange={(v) => setTransferForm({ ...transferForm, catatan: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih Keterangan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Naik kelas">Naik Kelas</SelectItem>
                  <SelectItem value="Tinggal kelas">Tinggal Kelas</SelectItem>
                  <SelectItem value="Pindah kelas">Pindah Kelas</SelectItem>
                  <SelectItem value="">Tanpa Keterangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTransferOpen(false); setTransferForm({ kelasId: '', tahunPelajaranId: '', catatan: '' }) }}>Batal</Button>
            <Button onClick={handleTransfer} disabled={isTransferring}>
              {isTransferring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
              {isTransferring ? 'Memproses...' : 'Pindahkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
