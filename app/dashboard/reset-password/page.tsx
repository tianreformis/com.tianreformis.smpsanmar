'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X, Eye, EyeOff, KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'

interface ResetRequest {
  id: string
  email: string
  reason: string | null
  status: string
  newPassword: string | null
  adminNote: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
  } | null
}

export default function ResetPasswordPage() {
  const [data, setData] = useState<ResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [approveOpen, setApproveOpen] = useState(false)
  const [selected, setSelected] = useState<ResetRequest | null>(null)
  const [approveForm, setApproveForm] = useState({ newPassword: '', adminNote: '' })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchData() }, [filter])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/auth/reset-password')
      const json = await res.json()
      setData(json.data || [])
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/auth/reset-password/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approveForm)
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Gagal memproses request')
      } else {
        toast.success(json.message)
        setApproveOpen(false)
        setSelected(null)
        setApproveForm({ newPassword: '', adminNote: '' })
        fetchData()
      }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/auth/reset-password/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: rejectNote || undefined })
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Gagal menolak request')
      } else {
        toast.success(json.message)
        setSelected(null)
        setRejectNote('')
        fetchData()
      }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setActionLoading(false) }
  }

  const filtered = (filter ? data.filter(r => r.status === filter) : data) || []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
        <p className="text-muted-foreground">Kelola request lupa password dari user</p>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>Semua</Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>Pending</Button>
        <Button variant={filter === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('approved')}>Disetujui</Button>
        <Button variant={filter === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('rejected')}>Ditolak</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(8)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell>
            </TableRow>
          ) : filtered.map((req, i) => (
            <TableRow key={req.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-medium">{req.user?.name || '-'}</TableCell>
              <TableCell>{req.email}</TableCell>
              <TableCell><Badge variant="outline">{req.user?.role || '-'}</Badge></TableCell>
              <TableCell className="max-w-[200px] truncate">{req.reason || '-'}</TableCell>
              <TableCell>
                <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'destructive' : 'warning'}>
                  {req.status === 'approved' ? 'Disetujui' : req.status === 'rejected' ? 'Ditolak' : 'Pending'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {dayjs(req.createdAt).format('DD MMM YYYY HH:mm')}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelected(req); setRejectNote(req.adminNote || '') }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {req.status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => { setSelected(req); setApproveOpen(true) }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { setSelected(req); setRejectNote('') }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Set Password Baru
            </DialogTitle>
            <DialogDescription>
              Atur password baru untuk {selected?.user?.name || selected?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApprove}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Masukkan password baru"
                    value={approveForm.newPassword}
                    onChange={(e) => setApproveForm({ ...approveForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="approve-note">Catatan (opsional)</Label>
                <Textarea
                  id="approve-note"
                  placeholder="Catatan untuk user..."
                  value={approveForm.adminNote}
                  onChange={(e) => setApproveForm({ ...approveForm, adminNote: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setApproveOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Memproses...' : 'Set Password & Setujui'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected && !approveOpen} onOpenChange={(open) => { if (!open) { setSelected(null); setRejectNote('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected?.status === 'pending' ? 'Tolak Request' : 'Detail Request'}
            </DialogTitle>
            <DialogDescription>
              {selected?.status === 'pending' ? 'Berikan catatan penolakan' : 'Informasi request'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Nama:</span>
              <span className="font-medium">{selected?.user?.name || '-'}</span>
              <span className="text-muted-foreground">Email:</span>
              <span>{selected?.email}</span>
              <span className="text-muted-foreground">Role:</span>
              <span>{selected?.user?.role || '-'}</span>
              <span className="text-muted-foreground">Alasan:</span>
              <span>{selected?.reason || '-'}</span>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={selected?.status === 'approved' ? 'success' : selected?.status === 'rejected' ? 'destructive' : 'warning'}>
                {selected?.status === 'approved' ? 'Disetujui' : selected?.status === 'rejected' ? 'Ditolak' : 'Pending'}
              </Badge>
              {selected?.adminNote && (
                <>
                  <span className="text-muted-foreground">Catatan Admin:</span>
                  <span>{selected.adminNote}</span>
                </>
              )}
            </div>
            {selected?.status === 'pending' && (
              <div className="space-y-2">
                <Label htmlFor="reject-note">Catatan Penolakan</Label>
                <Textarea
                  id="reject-note"
                  placeholder="Alasan penolakan..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          {selected?.status === 'pending' && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setSelected(null); setRejectNote('') }}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Memproses...' : 'Tolak Request'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
