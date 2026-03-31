import { z } from 'zod'

const fieldLabels: Record<string, string> = {
  nip: 'NIP',
  nama: 'Nama',
  email: 'Email',
  no_hp: 'No HP',
  alamat: 'Alamat',
  foto: 'Foto',
  nisn: 'NISN',
  jenis_kelamin: 'Jenis Kelamin',
  tanggal_lahir: 'Tanggal Lahir',
  kelasId: 'Kelas',
  nama_kelas: 'Nama Kelas',
  waliKelasId: 'Wali Kelas',
  nama_mapel: 'Mata Pelajaran',
  guruId: 'Guru',
  mapelId: 'Mata Pelajaran',
  siswaId: 'Siswa',
  kelas: 'Kelas',
  hari: 'Hari',
  jam_mulai: 'Jam Mulai',
  jam_selesai: 'Jam Selesai',
  nilai: 'Nilai',
  semester: 'Semester',
  asal_sekolah: 'Asal Sekolah',
  title: 'Judul',
  slug: 'Slug',
  content: 'Konten',
  thumbnail: 'Thumbnail',
  status: 'Status',
  password: 'Password',
  name: 'Nama',
  role: 'Role'
}

export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const field = err.path.join('.')
      const label = fieldLabels[field] || field
      return `${label}: ${err.message}`
    })
    .join(', ')
}
