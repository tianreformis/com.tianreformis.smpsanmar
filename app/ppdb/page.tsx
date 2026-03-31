'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { School, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PPDBDPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    nama: '', nisn: '', asal_sekolah: '', alamat: '', no_hp: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/ppdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      if (res.ok) {
        const data = await res.json()
        setSubmitted(true)
        toast.success('Pendaftaran berhasil!')
      } else {
        toast.error('Gagal mendaftar')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-muted-foreground mb-6">
              Data Anda telah berhasil terdaftar. Tim sekolah akan menghubungi Anda untuk proses selanjutnya.
            </p>
            <Link href="/">
              <Button>Kembali ke Beranda</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-white shadow-lg">
              <School className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Penerimaan Siswa Baru</h1>
          <p className="text-muted-foreground">Tahun Pelajaran 2026/2027</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Formulir Pendaftaran</CardTitle>
            <CardDescription>Isi data di bawah ini dengan benar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>NISN</Label>
                <Input value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} required minLength={10} maxLength={10} />
              </div>
              <div className="space-y-2">
                <Label>Asal Sekolah</Label>
                <Input value={form.asal_sekolah} onChange={(e) => setForm({ ...form, asal_sekolah: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>No HP / WhatsApp</Label>
                <Input type="tel" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Mengirim...' : 'Daftar Sekarang'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Sudah punya akun? <Link href="/login" className="text-primary hover:underline">Login di sini</Link></p>
        </div>
      </div>
    </div>
  )
}
