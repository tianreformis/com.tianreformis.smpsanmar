import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' })
})

export const siswaSchema = z.object({
  nisn: z.string().min(10, { message: 'NISN harus 10 digit' }).max(10, { message: 'NISN harus 10 digit' }),
  nama: z.string().min(2, { message: 'Nama minimal 2 karakter' }),
  jenis_kelamin: z.enum(['L', 'P']),
  tanggal_lahir: z.string(),
  alamat: z.string().min(5, { message: 'Alamat minimal 5 karakter' }),
  no_hp: z.string().min(10, { message: 'No HP minimal 10 digit' }),
  kelasId: z.string().optional(),
  foto: z.string().optional()
})

export const guruSchema = z.object({
  nip: z.string().min(5, { message: 'NIP minimal 5 karakter' }).max(18, { message: 'NIP maksimal 18 karakter' }).optional().or(z.literal('')),
  nama: z.string().min(2, { message: 'Nama minimal 2 karakter' }),
  email: z.string().email({ message: 'Email tidak valid' }),
  no_hp: z.string().min(10, { message: 'No HP minimal 10 digit' }),
  alamat: z.string().min(5, { message: 'Alamat minimal 5 karakter' }),
  foto: z.string().optional()
})

export const kelasSchema = z.object({
  nama_kelas: z.string().min(2, { message: 'Nama kelas minimal 2 karakter' }),
  waliKelasId: z.string().optional()
})

export const mapelSchema = z.object({
  nama_mapel: z.string().min(2, { message: 'Nama mata pelajaran minimal 2 karakter' }),
  kelasId: z.string().min(1, { message: 'Kelas harus dipilih' })
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
  nilai: z.number().min(0, { message: 'Nilai minimal 0' }).max(100, { message: 'Nilai maksimal 100' }),
  semester: z.enum(['Ganjil', 'Genap']),
  jenis: z.string().min(1, { message: 'Jenis nilai harus diisi' }),
  tanggal: z.string().optional()
})

export const nilaiFilterSchema = z.object({
  tahunPelajaranId: z.string().min(1, { message: 'Tahun pelajaran harus dipilih' }),
  semester: z.enum(['Ganjil', 'Genap'])
})

export const ppdbSchema = z.object({
  nama: z.string().min(2, { message: 'Nama minimal 2 karakter' }),
  nisn: z.string().min(10, { message: 'NISN harus 10 digit' }).max(10, { message: 'NISN harus 10 digit' }),
  asal_sekolah: z.string().min(2, { message: 'Asal sekolah minimal 2 karakter' }),
  alamat: z.string().min(5, { message: 'Alamat minimal 5 karakter' }),
  no_hp: z.string().min(10, { message: 'No HP minimal 10 digit' })
})

export const blogSchema = z.object({
  title: z.string().min(3, { message: 'Judul minimal 3 karakter' }),
  slug: z.string().min(3, { message: 'Slug minimal 3 karakter' }),
  content: z.string().min(10, { message: 'Konten minimal 10 karakter' }),
  thumbnail: z.string().optional(),
  status: z.enum(['draft', 'publish'])
})

export const userSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  name: z.string().min(2, { message: 'Nama minimal 2 karakter' }),
  role: z.enum(['ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'SISWA']),
  siswaId: z.string().optional(),
  guruId: z.string().optional()
})

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid' }),
  reason: z.string().min(10, { message: 'Alasan minimal 10 karakter' }).optional()
})

export const resetPasswordAdminSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  adminNote: z.string().optional().or(z.literal(''))
})
