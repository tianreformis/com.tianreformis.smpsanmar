'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus, ExternalLink, Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  thumbnail?: string
  status: string
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FormData {
  title: string
  slug: string
  content: string
  thumbnail: string
  status: string
}

export default function BlogPage() {
  const [data, setData] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({ title: '', slug: '', content: '', thumbnail: '', status: 'draft' })
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 5, totalPages: 0 })
  const [perPage, setPerPage] = useState(5)

  useEffect(() => {
    fetchData()
  }, [pagination.page, perPage])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/blog?page=${pagination.page}&limit=${perPage}`)
      const json = await res.json()
      setData(json.data || [])
      setPagination(json.pagination || { total: 0, page: 1, limit: 5, totalPages: 0 })
    } catch { toast.error('Gagal mengambil data') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingId ? `/api/blog/${editingId}` : '/api/blog'
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

  const handleEdit = (post: BlogPost) => {
    setEditingId(post.id)
    setForm({ title: post.title, slug: post.slug, content: post.content, thumbnail: post.thumbnail || '', status: post.status })
    setPreviewUrl(post.thumbnail || '')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus?')) return
    try {
      await fetch(`/api/blog/${id}`, { method: 'DELETE' })
      toast.success('Berhasil hapus')
      fetchData()
    } catch { toast.error('Gagal hapus') }
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ title: '', slug: '', content: '', thumbnail: '', status: 'draft' })
    setPreviewUrl('')
    setImageMode('url')
  }

  const generateSlug = () => {
    const slug = form.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    setForm({ ...form, slug })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Gagal upload')
        return
      }

      setForm({ ...form, thumbnail: json.url })
      setPreviewUrl(json.url)
      toast.success('Upload berhasil')
    } catch {
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setForm({ ...form, thumbnail: '' })
    setPreviewUrl('')
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
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Blog</h2>
          <p className="text-muted-foreground">Kelola artikel berita sekolah</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Artikel
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tampilkan</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
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
        <span className="text-sm text-muted-foreground">Total: {pagination.total} artikel</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Thumbnail</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          )) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell>
            </TableRow>
          ) : data.map((post, i) => (
            <TableRow key={post.id}>
              <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
              <TableCell>
                {post.thumbnail ? (
                  <img src={post.thumbnail} alt="" className="h-10 w-16 object-cover rounded" />
                ) : (
                  <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell className="font-mono text-sm">{post.slug}</TableCell>
              <TableCell>
                <Badge variant={post.status === 'publish' ? 'success' : 'secondary'}>{post.status}</Badge>
              </TableCell>
              <TableCell>{new Date(post.createdAt).toLocaleDateString('id-ID')}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link href={`/blog/${post.slug}`}>
                    <Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                  </Link>
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(post)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(post.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Artikel' : 'Tambah Artikel'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="flex gap-2 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                </div>
                <Button type="button" variant="outline" onClick={generateSlug}>Generate</Button>
              </div>
              <div className="space-y-2">
                <Label>Konten</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="min-h-[200px]" required />
              </div>

              <div className="space-y-3">
                <Label>Featured Image</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={imageMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageMode('url')}
                    className="flex items-center gap-1"
                  >
                    <LinkIcon className="h-4 w-4" /> URL
                  </Button>
                  <Button
                    type="button"
                    variant={imageMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageMode('upload')}
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4" /> Upload
                  </Button>
                </div>

                {imageMode === 'url' ? (
                  <Input
                    value={form.thumbnail}
                    onChange={(e) => { setForm({ ...form, thumbnail: e.target.value }); setPreviewUrl(e.target.value) }}
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">Maksimal 2MB. Format: JPEG, PNG, WebP, GIF</p>
                  </div>
                )}

                {previewUrl && (
                  <div className="relative mt-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg border"
                      onError={() => setPreviewUrl('')}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="publish">Publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }}>Batal</Button>
              <Button type="submit" disabled={uploading}>{editingId ? 'Update' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
