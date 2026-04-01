'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Guru {
  id: string
  nip: string
  nama: string
  email: string
  no_hp: string
  alamat: string
}

interface PaginationState {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FormData {
  nip?: string
  nama: string
  email: string
  no_hp: string
  alamat: string
}

export default function GuruPage() {
  const [data, setData] = useState<Guru[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [perPage, setPerPage] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({ nip: '', nama: '', email: '', no_hp: '', alamat: '' })

  useEffect(() => { fetchData() }, [pagination.page, perPage, search])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/guru?search=${search}&page=${pagination.page}&limit=${perPage}`)
      const json = await res.json()
      setData(json.data || [])
      setPagination(json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 })
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingId ? `/api/guru/${editingId}` : '/api/guru'
    const method = editingId ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Berhasil update' : 'Berhasil tambah')
        setIsModalOpen(false)
        resetForm()
        fetchData()
      } else { toast.error(json.error?.[0]?.message || json.error || 'Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleEdit = (guru: Guru) => {
    setEditingId(guru.id)
    setForm({ nip: guru.nip, nama: guru.nama, email: guru.email, no_hp: guru.no_hp, alamat: guru.alamat })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus?')) return
    try {
      await fetch(`/api/guru/${id}`, { method: 'DELETE' })
      toast.success('Berhasil hapus')
      fetchData()
    } catch { toast.error('Gagal hapus') }
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ nip: '', nama: '', email: '', no_hp: '', alamat: '' })
  }

  const handlePerPageChange = (val: string) => {
    const num = parseInt(val)
    setPerPage(num)
    setPagination(p => ({ ...p, page: 1 }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Guru</h2>
          <p className="text-muted-foreground">Kelola data guru</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Guru
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama atau NIP..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }} />
        </div>
      </div>

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
        <span className="text-sm text-muted-foreground">Total: {pagination.total} guru</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>No HP</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : data.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
          ) : data.map((guru, i) => (
            <TableRow key={guru.id}>
              <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
              <TableCell className="font-mono">{guru.nip || '-'}</TableCell>
              <TableCell className="font-medium">{guru.nama}</TableCell>
              <TableCell>{guru.email}</TableCell>
              <TableCell>{guru.no_hp}</TableCell>
              <TableCell className="max-w-[200px] truncate">{guru.alamat}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(guru)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(guru.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? 'Edit Guru' : 'Tambah Guru'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>NIP <span className="text-muted-foreground font-normal">(opsional)</span></Label><Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} /></div>
              <div className="space-y-2"><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              {editingId && (
                <p className="text-xs text-muted-foreground -mt-2">Password tidak bisa diubah langsung. Gunakan menu Reset Password jika perlu.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>No HP</Label><Input value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required /></div>
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
