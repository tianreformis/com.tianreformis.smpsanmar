'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Pencil, Trash2, Plus, CheckCircle, RotateCw, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TahunPelajaran {
  id: string
  tahun: string
  isActive: boolean
  createdAt: string
}

interface Kelas {
  id: string
  nama_kelas: string
  waliKelas?: { id: string; nama: string }
}

interface Guru {
  id: string
  nama: string
}

interface KelasMapping {
  oldKelasId: string
  nama: string
  waliKelasId: string
}

export default function TahunPelajaranPage() {
  const [data, setData] = useState<TahunPelajaran[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRollOverOpen, setIsRollOverOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ tahun: '', isActive: false })
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [guru, setGuru] = useState<Guru[]>([])
  const [kelasMappings, setKelasMappings] = useState<KelasMapping[]>([])
  const [newTahun, setNewTahun] = useState('')
  const [isRollingOver, setIsRollingOver] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/tahun-pelajaran')
      const json = await res.json()
      setData(json.data || [])
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const fetchKelasAndGuru = async () => {
    const [kRes, gRes] = await Promise.all([
      fetch('/api/kelas?limit=100'),
      fetch('/api/guru?limit=100')
    ])
    const kJson = await kRes.json()
    const gJson = await gRes.json()
    setKelas(kJson.data || [])
    setGuru(gJson.data || [])
    setKelasMappings((kJson.data || []).map((k: Kelas) => ({
      oldKelasId: k.id,
      nama: k.nama_kelas,
      waliKelasId: k.waliKelas?.id || ''
    })))
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

  const handleRollOver = async () => {
    if (!newTahun) { toast.error('Tahun pelajaran baru harus diisi'); return }
    if (!confirm(`Yakin roll over ke ${newTahun}? Semua siswa akan disalin ke tahun pelajaran baru.`)) return

    setIsRollingOver(true)
    try {
      const res = await fetch('/api/tahun-pelajaran/roll-over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTahun, kelasMappings })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(json.message)
        setIsRollOverOpen(false)
        setNewTahun('')
        fetchData()
      } else { toast.error(typeof json.error === 'string' ? json.error : 'Gagal roll over') }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setIsRollingOver(false) }
  }

  const activeTP = data.find(tp => tp.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tahun Pelajaran</h2>
          <p className="text-muted-foreground">Kelola tahun pelajaran dan roll over data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchKelasAndGuru(); setIsRollOverOpen(true) }} disabled={!activeTP}>
            <RotateCw className="h-4 w-4 mr-2" /> Roll Over
          </Button>
          <Button onClick={() => { setEditingId(null); setForm({ tahun: '', isActive: false }); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Tahun Pelajaran
          </Button>
        </div>
      </div>

      {!activeTP && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Belum ada tahun pelajaran aktif</AlertTitle>
          <AlertDescription>Buat tahun pelajaran baru dan set sebagai aktif untuk mulai menggunakan sistem.</AlertDescription>
        </Alert>
      )}

      {activeTP && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tahun Pelajaran Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTP.tahun}</div>
          </CardContent>
        </Card>
      )}

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

      {/* Add/Edit Dialog */}
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

      {/* Roll Over Dialog */}
      <Dialog open={isRollOverOpen} onOpenChange={(open) => { if (!open) setIsRollOverOpen(false) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Roll Over Tahun Pelajaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>
                Roll over akan menyalin semua siswa ke tahun pelajaran baru. Jadwal dan nilai tidak akan disalin (mulai dari awal). Guru pengampu mapel perlu ditetapkan ulang.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Tahun Pelajaran Baru</Label>
              <Input value={newTahun} onChange={(e) => setNewTahun(e.target.value)} placeholder="Contoh: 2026/2027" />
            </div>

            <div className="space-y-2">
              <Label>Pemetaan Kelas & Wali Kelas</Label>
              <p className="text-sm text-muted-foreground">Atur nama kelas dan wali kelas untuk tahun pelajaran baru</p>
              {kelasMappings.map((mapping, i) => (
                <div key={mapping.oldKelasId} className="flex items-center gap-2 p-2 border rounded">
                  <span className="text-sm font-medium w-20">{kelas[i]?.nama_kelas}</span>
                  <span className="text-muted-foreground">→</span>
                  <Input
                    className="w-24"
                    value={mapping.nama}
                    onChange={(e) => {
                      const newMappings = [...kelasMappings]
                      newMappings[i].nama = e.target.value
                      setKelasMappings(newMappings)
                    }}
                    placeholder="Nama kelas"
                  />
                  <Select
                    value={mapping.waliKelasId}
                    onValueChange={(v) => {
                      const newMappings = [...kelasMappings]
                      newMappings[i].waliKelasId = v
                      setKelasMappings(newMappings)
                    }}
                  >
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Wali Kelas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tanpa Wali Kelas</SelectItem>
                      {guru.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRollOverOpen(false)}>Batal</Button>
            <Button onClick={handleRollOver} disabled={isRollingOver || !newTahun}>
              {isRollingOver ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCw className="h-4 w-4 mr-2" />}
              {isRollingOver ? 'Memproses...' : 'Roll Over'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
