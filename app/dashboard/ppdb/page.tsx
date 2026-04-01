'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'

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
  const [perPage, setPerPage] = useState(10)
  const [tahunPelajaran, setTahunPelajaran] = useState<{ id: string; tahun: string }[]>([])
  const [activeTP, setActiveTP] = useState<string>('')
  const [filterTP, setFilterTP] = useState<string>('all')

  useEffect(() => {
    fetchTahunPelajaran()
  }, [])

  useEffect(() => { fetchData() }, [filter, pagination.page, perPage, filterTP])

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

  const fetchData = async () => {
    setLoading(true)
    try {
      const url = `/api/ppdb?status=${filter}&page=${pagination.page}&limit=${perPage}${filterTP && filterTP !== 'all' ? `&tahunPelajaranId=${filterTP}` : ''}`
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

  const handlePerPageChange = (val: string) => {
    const num = parseInt(val)
    setPerPage(num)
    setPagination(p => ({ ...p, page: 1 }))
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
        </div>
        <span className="text-sm text-muted-foreground">Total: {pagination.total} pendaftar</span>
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
    </div>
  )
}
