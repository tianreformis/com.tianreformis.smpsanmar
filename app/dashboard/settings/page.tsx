'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/components/theme-provider'
import { useFont } from '@/components/font-provider'
import { toast } from 'react-hot-toast'
import { User, Palette, Type, Eye, Check, Monitor, Moon, Sun } from 'lucide-react'

type FontFamily = 'poppins' | 'inter' | 'roboto-slab' | 'merriweather' | 'fira-code'

const fontOptions = [
  { value: 'poppins', label: 'Poppins', desc: 'Default - Clean & modern sans-serif', preview: 'Aa Bb Cc 123' },
  { value: 'inter', label: 'Inter', desc: 'Sans-serif - Optimized for screens', preview: 'Aa Bb Cc 123' },
  { value: 'roboto-slab', label: 'Roboto Slab', desc: 'Serif - Elegant slab serif', preview: 'Aa Bb Cc 123' },
  { value: 'merriweather', label: 'Merriweather', desc: 'Serif - Classic readable serif', preview: 'Aa Bb Cc 123' },
  { value: 'fira-code', label: 'Fira Code', desc: 'Monospace - Developer font with ligatures', preview: 'Aa Bb Cc 123' },
]

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { theme, setTheme } = useTheme()
  const { fontFamily, setFontFamily } = useFont()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' })
  const [previewFont, setPreviewFont] = useState<FontFamily>('poppins')

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || '',
        email: session.user.email || '',
        currentPassword: '',
        newPassword: ''
      })
    }
  }, [session])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email })
      })
      if (res.ok) {
        toast.success('Profil berhasil diperbarui')
        await update()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memperbarui profil')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.currentPassword || !form.newPassword) {
      toast.error('Isi semua field password')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      })
      if (res.ok) {
        toast.success('Password berhasil diubah')
        setForm({ ...form, currentPassword: '', newPassword: '' })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah password')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const themes = [
    { key: 'light' as const, label: 'Light', icon: Sun, desc: 'Tema terang' },
    { key: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Tema gelap' },
    { key: 'system' as const, label: 'System', icon: Monitor, desc: 'Ikuti sistem' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Kelola profil, tema, dan tampilan</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="h-4 w-4 mr-2" /> Appearance</TabsTrigger>
          <TabsTrigger value="font"><Type className="h-4 w-4 mr-2" /> Font</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>Perbarui nama dan email Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Badge variant="secondary">{session?.user?.role}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ganti Password</CardTitle>
                <CardDescription>Ubah password akun Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Password Saat Ini</Label>
                    <Input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Baru</Label>
                    <Input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Ubah Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>Pilih tema tampilan aplikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {themes.map(({ key, label, icon: Icon, desc }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`relative rounded-lg border-2 p-4 text-left transition-all hover:bg-accent ${
                      theme === key ? 'border-primary bg-accent' : 'border-transparent'
                    }`}
                  >
                    <div className={`rounded-md border p-4 mb-3 ${key === 'dark' ? 'bg-gray-900' : key === 'system' ? 'bg-gradient-to-br from-white to-gray-900' : 'bg-white'}`}>
                      <div className="flex items-center gap-2">
                        {key === 'dark' ? <Moon className="h-4 w-4 text-blue-400" /> : key === 'system' ? <Monitor className="h-4 w-4 text-gray-600" /> : <Sun className="h-4 w-4 text-yellow-500" />}
                        <div className="flex-1 space-y-2">
                          <div className={`h-2 rounded ${key === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                          <div className={`h-2 w-2/3 rounded ${key === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      {theme === key && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="font">
          <Card>
            <CardHeader>
              <CardTitle>Font</CardTitle>
              <CardDescription>Pilih font yang digunakan di seluruh aplikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fontOptions.map(({ value, label, desc, preview }) => (
                  <button
                    key={value}
                    onClick={() => { setFontFamily(value as FontFamily); setPreviewFont(value as FontFamily) }}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all hover:bg-accent ${
                      fontFamily === value ? 'border-primary bg-accent' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{label}</p>
                          <Badge variant={fontFamily === value ? 'default' : 'secondary'} className="text-xs">
                            {value === 'fira-code' ? 'Monospace' : value === 'roboto-slab' || value === 'merriweather' ? 'Serif' : 'Sans-serif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                        <p className={`text-2xl mt-2 ${value === 'fira-code' ? 'font-fira-code' : value === 'roboto-slab' ? 'font-roboto-slab' : value === 'merriweather' ? 'font-merriweather' : value === 'inter' ? 'font-inter' : 'font-poppins'}`}>
                          {preview}
                        </p>
                      </div>
                      {fontFamily === value && <Check className="h-5 w-5 text-primary shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Preview</p>
                </div>
                <p className={`text-lg ${previewFont === 'fira-code' ? 'font-fira-code' : previewFont === 'roboto-slab' ? 'font-roboto-slab' : previewFont === 'merriweather' ? 'font-merriweather' : previewFont === 'inter' ? 'font-inter' : 'font-poppins'}`}>
                  Sistem Manajemen Sekolah - The quick brown fox jumps over the lazy dog. 0123456789
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
