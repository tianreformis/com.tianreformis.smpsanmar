'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TahunPelajaran {
  id: string
  tahun: string
  isActive: boolean
  createdAt: string
}

export default function TahunPelajaranPage() {
  const [data, setData] = useState<TahunPelajaran[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ tahun: '', isActive: false })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/tahun-pelajaran')
      const json = await res.json()
      setData(json.data || [])
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = '/api/tahun-pelajaran'
    const method = editingId ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(editingId && { id: editingId }), ...form })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Berhasil update' : 'Berhasil tambah')
        setIsModalOpen(false)
        setForm({ tahun: '', isActive: false })
        setEditingId(null)
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleEdit = (tp: TahunPelajaran) => {
    setEditingId(tp.id)
    setForm({ tahun: tp.tahun, isActive: tp.isActive })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus?')) return
    try {
      const res = await fetch(`/api/tahun-pelajaran?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        toast.success('Berhasil hapus')
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal hapus') }
    } catch { toast.error('Gagal hapus') }
  }

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch('/api/tahun-pelajaran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: true })
      })
      if (res.ok) {
        toast.success('Tahun pelajaran aktif berhasil diubah')
        fetchData()
      } else { toast.error('Gagal mengubah') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tahun Pelajaran</h2>
          <p className="text-muted-foreground">Kelola tahun pelajaran aktif</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ tahun: '', isActive: false }); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Tahun Pelajaran
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Tahun Pelajaran</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : data.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada tahun pelajaran</TableCell></TableRow>
          ) : data.map((tp, i) => (
            <TableRow key={tp.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-medium">{tp.tahun}</TableCell>
              <TableCell>
                {tp.isActive ? (
                  <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Aktif</Badge>
                ) : (
                  <Badge variant="secondary">Tidak Aktif</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {!tp.isActive && (
                    <Button size="sm" variant="outline" onClick={() => handleSetActive(tp.id)}>Set Aktif</Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(tp)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(tp.id)} className="text-red-500" disabled={tp.isActive}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tahun Pelajaran</Label>
                <Input value={form.tahun} onChange={(e) => setForm({ ...form, tahun: e.target.value })} placeholder="Contoh: 2025/2026" required />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Set sebagai tahun pelajaran aktif</Label>
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
