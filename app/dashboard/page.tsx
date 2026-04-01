'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Users, School, ClipboardList, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  totalSiswa: number
  totalGuru: number
  totalKelas: number
  totalPPDB: number
  siswaPerKelas: { nama: string; value: number }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tahunPelajaran, setTahunPelajaran] = useState<{ id: string; tahun: string }[]>([])
  const [activeTP, setActiveTP] = useState<string>('')
  const [selectedTP, setSelectedTP] = useState<string>('')

  useEffect(() => {
    fetchTahunPelajaran()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [selectedTP])

  const fetchTahunPelajaran = async () => {
    try {
      const res = await fetch('/api/tahun-pelajaran')
      const json = await res.json()
      setTahunPelajaran(json.data || [])
      const active = json.data?.find((tp: any) => tp.isActive)
      if (active) {
        setActiveTP(active.id)
        setSelectedTP(active.id)
      }
    } catch (e) { console.error('Error fetching tahun pelajaran') }
  }

  const fetchStats = async () => {
    try {
      const url = `/api/stats${selectedTP ? `?tahunPelajaranId=${selectedTP}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const activeTPLabel = tahunPelajaran.find(tp => tp.id === activeTP)?.tahun || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview sistem manajemen sekolah</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tahun Pelajaran:</span>
          <Select value={selectedTP} onValueChange={setSelectedTP}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={activeTPLabel || 'Pilih'} />
            </SelectTrigger>
            <SelectContent>
              {tahunPelajaran.map(tp => (
                <SelectItem key={tp.id} value={tp.id}>
                  {tp.tahun}{tp.id === activeTP ? ' (Aktif)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSiswa || 0}</div>
            <p className="text-xs text-muted-foreground">Siswa aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGuru || 0}</div>
            <p className="text-xs text-muted-foreground">Guru aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKelas || 0}</div>
            <p className="text-xs text-muted-foreground">Kelas aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PPDB Pending</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPPDB || 0}</div>
            <p className="text-xs text-muted-foreground">Menunggu konfirmasi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribusi Siswa per Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.siswaPerKelas || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nama" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
