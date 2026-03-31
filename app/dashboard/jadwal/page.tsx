'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Option { id: string; label: string }
interface Jadwal {
  id: string
  hari: string
  jam_mulai: string
  jam_selesai: string
  kelas: { nama_kelas: string }
  mapel: { nama_mapel: string }
  guru: { nama: string }
}

export default function JadwalPage() {
  const [data, setData] = useState<Jadwal[]>([])
  const [kelas, setKelas] = useState<Option[]>([])
  const [mapel, setMapel] = useState<Option[]>([])
  const [guru, setGuru] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ kelasId: '', mapelId: '', guruId: '', hari: '', jam_mulai: '', jam_selesai: '' })

  const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  useEffect(() => { fetchData(); fetchOptions() }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/jadwal')
      const json = await res.json()
      setData(json.data)
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchOptions = async () => {
    const [k, m, g] = await Promise.all([
      fetch('/api/kelas').then(r => r.json()),
      fetch('/api/mapel').then(r => r.json()),
      fetch('/api/guru').then(r => r.json())
    ])
    setKelas(k.data.map((x: any) => ({ id: x.id, label: x.nama_kelas })))
    setMapel(m.data.map((x: any) => ({ id: x.id, label: x.nama_mapel })))
    setGuru(g.data.map((x: any) => ({ id: x.id, label: x.nama })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingId ? `/api/jadwal/${editingId}` : '/api/jadwal'
    const method = editingId ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        toast.success(editingId ? 'Berhasil update' : 'Berhasil tambah')
        setIsModalOpen(false)
        resetForm()
        fetchData()
      } else { toast.error('Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const handleEdit = (jadwal: Jadwal) => {
    setEditingId(jadwal.id)
    setForm({ kelasId: '', mapelId: '', guruId: '', hari: jadwal.hari, jam_mulai: jadwal.jam_mulai, jam_selesai: jadwal.jam_selesai })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus?')) return
    try {
      await fetch(`/api/jadwal/${id}`, { method: 'DELETE' })
      toast.success('Berhasil hapus')
      fetchData()
    } catch { toast.error('Gagal hapus') }
  }

  const resetForm = () => { setEditingId(null); setForm({ kelasId: '', mapelId: '', guruId: '', hari: '', jam_mulai: '', jam_selesai: '' }) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Jadwal</h2>
          <p className="text-muted-foreground">Kelola jadwal pelajaran</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Hari</TableHead>
            <TableHead>Jam</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Mapel</TableHead>
            <TableHead>Guru</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : data.map((jadwal, i) => (
            <TableRow key={jadwal.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-medium">{jadwal.hari}</TableCell>
              <TableCell>{jadwal.jam_mulai} - {jadwal.jam_selesai}</TableCell>
              <TableCell>{jadwal.kelas.nama_kelas}</TableCell>
              <TableCell>{jadwal.mapel.nama_mapel}</TableCell>
              <TableCell>{jadwal.guru.nama}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(jadwal)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(jadwal.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hari</Label>
                  <Select value={form.hari} onValueChange={(v) => setForm({ ...form, hari: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih Hari" /></SelectTrigger>
                    <SelectContent>{hariOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Jam Mulai</Label><Input type="time" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Jam Selesai</Label><Input type="time" value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} required /></div>
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={form.kelasId} onValueChange={(v) => setForm({ ...form, kelasId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>{kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mapel</Label>
                <Select value={form.mapelId} onValueChange={(v) => setForm({ ...form, mapelId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                  <SelectContent>{mapel.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Guru</Label>
                <Select value={form.guruId} onValueChange={(v) => setForm({ ...form, guruId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Guru" /></SelectTrigger>
                  <SelectContent>{guru.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}</SelectContent>
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
