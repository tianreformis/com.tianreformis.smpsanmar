'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Pagination } from '@/components/ui/pagination-custom'

interface PPDB {
  id: string
  nama: string
  nisn: string
  asal_sekolah: string
  alamat: string
  no_hp: string
  status: string
  createdAt: string
}

interface PaginationState {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function PPDBAdminPage() {
  const [data, setData] = useState<PPDB[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: 10, totalPages: 0 })

  useEffect(() => { fetchData() }, [filter, pagination.page])

  const fetchData = async () => {
    setLoading(true)
    try {
      const url = `/api/ppdb?status=${filter}&page=${pagination.page}&limit=${pagination.limit}`
      const res = await fetch(url)
      const json = await res.json()
      setData(json.data || [])
      setPagination(json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 })
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/ppdb/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Pendaftar berhasil di${status === 'diterima' ? 'terima' : 'tolak'}`)
        fetchData()
      } else { toast.error('Gagal update') }
    } catch { toast.error('Terjadi kesalahan') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PPDB Management</h2>
          <p className="text-muted-foreground">Kelola pendaftaran siswa baru</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter(''); setPagination(p => ({ ...p, page: 1 })) }}>Semua</Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('pending'); setPagination(p => ({ ...p, page: 1 })) }}>Pending</Button>
        <Button variant={filter === 'diterima' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('diterima'); setPagination(p => ({ ...p, page: 1 })) }}>Diterima</Button>
        <Button variant={filter === 'ditolak' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('ditolak'); setPagination(p => ({ ...p, page: 1 })) }}>Ditolak</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>NISN</TableHead>
            <TableHead>Asal Sekolah</TableHead>
            <TableHead>No HP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : data.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data pendaftar</TableCell></TableRow>
          ) : data.map((ppdb, i) => (
            <TableRow key={ppdb.id}>
              <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
              <TableCell className="font-medium">{ppdb.nama}</TableCell>
              <TableCell className="font-mono">{ppdb.nisn}</TableCell>
              <TableCell>{ppdb.asal_sekolah}</TableCell>
              <TableCell>{ppdb.no_hp}</TableCell>
              <TableCell>
                <Badge variant={ppdb.status === 'diterima' ? 'success' : ppdb.status === 'ditolak' ? 'destructive' : 'warning'}>
                  {ppdb.status}
                </Badge>
              </TableCell>
              <TableCell>
                {ppdb.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="text-green-600" onClick={() => handleStatus(ppdb.id, 'diterima')}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleStatus(ppdb.id, 'ditolak')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} />
    </div>
  )
}
