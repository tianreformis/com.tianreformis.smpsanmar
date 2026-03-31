import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const siswaSchema = z.object({
  nisn: z.string().min(10).max(10),
  nama: z.string().min(2),
  jenis_kelamin: z.enum(['L', 'P']),
  tanggal_lahir: z.string(),
  alamat: z.string().min(5),
  no_hp: z.string().min(10),
  kelasId: z.string().optional(),
  foto: z.string().optional()
})

export const guruSchema = z.object({
  nip: z.string().min(10).max(18),
  nama: z.string().min(2),
  email: z.string().email(),
  no_hp: z.string().min(10),
  alamat: z.string().min(5),
  foto: z.string().optional()
})

export const kelasSchema = z.object({
  nama_kelas: z.string().min(2),
  waliKelasId: z.string().optional()
})

export const mapelSchema = z.object({
  nama_mapel: z.string().min(2),
  guruId: z.string().optional()
})

export const jadwalSchema = z.object({
  kelasId: z.string(),
  mapelId: z.string(),
  guruId: z.string(),
  hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']),
  jam_mulai: z.string(),
  jam_selesai: z.string()
})

export const nilaiSchema = z.object({
  siswaId: z.string(),
  mapelId: z.string(),
  nilai: z.number().min(0).max(100),
  semester: z.string()
})

export const ppdbSchema = z.object({
  nama: z.string().min(2),
  nisn: z.string().min(10).max(10),
  asal_sekolah: z.string().min(2),
  alamat: z.string().min(5),
  no_hp: z.string().min(10)
})

export const blogSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  content: z.string().min(10),
  thumbnail: z.string().optional(),
  status: z.enum(['draft', 'publish'])
})

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'GURU', 'SISWA']),
  siswaId: z.string().optional(),
  guruId: z.string().optional()
})
