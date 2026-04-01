import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const namaDepanL = ['Ahmad', 'Budi', 'Dimas', 'Eko', 'Fajar', 'Galih', 'Hendra', 'Irfan', 'Joko', 'Kevin', 'Luthfi', 'Muhammad', 'Naufal', 'Oscar', 'Putra', 'Rizky', 'Sandi', 'Teguh', 'Umar', 'Wahyu', 'Yoga', 'Zaki', 'Adi', 'Bayu', 'Cahya', 'Daffa', 'Farhan', 'Gilang', 'Haikal', 'Ilham']
const namaDepanP = ['Aisyah', 'Bella', 'Citra', 'Dewi', 'Elsa', 'Fatimah', 'Gita', 'Hana', 'Indah', 'Jasmine', 'Kartika', 'Laras', 'Maya', 'Nabila', 'Olivia', 'Putri', 'Qonita', 'Rina', 'Salsabila', 'Tari', 'Umi', 'Vina', 'Wulan', 'Xena', 'Yuni', 'Zahra', 'Anisa', 'Bulan', 'Cantika', 'Dina']
const namaBelakang = ['Pratama', 'Saputra', 'Wibowo', 'Hidayat', 'Nugroho', 'Santoso', 'Setiawan', 'Susanto', 'Purnomo', 'Kurniawan', 'Rahman', 'Firmansyah', 'Maulana', 'Ramadhan', 'Surya', 'Wijaya', 'Utama', 'Hakim', 'Pambudi', 'Lestari', 'Sari', 'Putri', 'Handayani', 'Wulandari', 'Ningsih', 'Rahayu', 'Kusuma', 'Wardani', 'Mulyani', 'Susanti']
const jalan = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Ahmad Yani', 'Jl. Diponegoro', 'Jl. Gatot Subroto', 'Jl. Kartini', 'Jl. Pahlawan', 'Jl. Pemuda', 'Jl. Raya', 'Jl. Melati', 'Jl. Anggrek', 'Jl. Mawar', 'Jl. Kenanga', 'Jl. Dahlia', 'Jl. Flamboyan']

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateNama(jk: string) {
  const depan = jk === 'L' ? pickRandom(namaDepanL) : pickRandom(namaDepanP)
  const belakang = pickRandom(namaBelakang)
  return `${depan} ${belakang}`
}

function generateTglLahir() {
  const year = randomInt(2011, 2013)
  const month = randomInt(1, 12)
  const day = randomInt(1, 28)
  return new Date(year, month - 1, day)
}

function generateNISN(index: number) {
  return String(1000000000 + index).padStart(10, '0')
}

async function main() {
  console.log('Start seeding...')

  // Create admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@sekolah.sch.id' } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: { email: 'admin@sekolah.sch.id', password: hashedPassword, name: 'Administrator', role: 'ADMIN' }
    })
  }
  console.log('Created admin')

  // Create 9 guru (6 wali kelas + 3 guru tambahan)
  const guruData = [
    { nip: '198501012010011001', nama: 'Drs. Bambang Suryanto, M.Pd.', email: 'bambang.suryanto@sekolah.sch.id' },
    { nip: '198702152012012002', nama: 'Siti Aminah, S.Pd.', email: 'siti.aminah@sekolah.sch.id' },
    { nip: '199005202015012003', nama: 'Ahmad Hidayat, S.Pd.', email: 'ahmad.hidayat@sekolah.sch.id' },
    { nip: '198803102011011004', nama: 'Rini Wulandari, S.Pd.', email: 'rini.wulandari@sekolah.sch.id' },
    { nip: '199106252014012005', nama: 'Dewi Sartika, S.Pd.', email: 'dewi.sartika@sekolah.sch.id' },
    { nip: '198909122013011006', nama: 'Eko Prasetyo, S.Pd.', email: 'eko.prasetyo@sekolah.sch.id' },
    { nip: '199204182016012007', nama: 'Nur Halimah, S.Ag.', email: 'nur.halimah@sekolah.sch.id' },
    { nip: '198607302010011008', nama: 'Agus Setiawan, S.Pd.', email: 'agus.setiawan@sekolah.sch.id' },
    { nip: '199311222017012009', nama: 'Fitri Rahayu, S.Pd.', email: 'fitri.rahayu@sekolah.sch.id' },
  ]

  const guruIds: string[] = []
  for (const g of guruData) {
    const guru = await prisma.guru.upsert({
      where: { nip: g.nip },
      update: {},
      create: {
        nip: g.nip,
        nama: g.nama,
        email: g.email,
        no_hp: `08${randomInt(1000000000, 9999999999)}`,
        alamat: `${pickRandom(jalan)} No. ${randomInt(1, 50)}`
      }
    })
    guruIds.push(guru.id)

    const existingUser = await prisma.user.findUnique({ where: { email: g.email } })
    if (!existingUser) {
      await prisma.user.create({
        data: { email: g.email, password: await bcrypt.hash('guru123', 10), name: g.nama, role: 'GURU', guruId: guru.id }
      })
    }
  }
  console.log(`Created ${guruData.length} guru`)

  // Create 6 kelas (VII-A, VII-B, VIII-A, VIII-B, IX-A, IX-B)
  const kelasList = [
    { nama: 'VII-A', waliIdx: 0 },
    { nama: 'VII-B', waliIdx: 1 },
    { nama: 'VIII-A', waliIdx: 2 },
    { nama: 'VIII-B', waliIdx: 3 },
    { nama: 'IX-A', waliIdx: 4 },
    { nama: 'IX-B', waliIdx: 5 },
  ]

  const kelasMap: Record<string, string> = {}
  for (const k of kelasList) {
    const kelas = await prisma.kelas.upsert({
      where: { nama_kelas: k.nama },
      update: { waliKelasId: guruIds[k.waliIdx] },
      create: { nama_kelas: k.nama, waliKelasId: guruIds[k.waliIdx] }
    })
    kelasMap[k.nama] = kelas.id
  }
  console.log(`Created ${kelasList.length} kelas`)

  // Create mapel SMP
  const mapelList = [
    { nama: 'Matematika', guruIdx: 0 },
    { nama: 'Bahasa Indonesia', guruIdx: 1 },
    { nama: 'Bahasa Inggris', guruIdx: 2 },
    { nama: 'IPA', guruIdx: 3 },
    { nama: 'IPS', guruIdx: 4 },
    { nama: 'PKN', guruIdx: 5 },
    { nama: 'Pendidikan Agama Islam', guruIdx: 6 },
    { nama: 'Seni Budaya', guruIdx: 7 },
    { nama: 'PJOK', guruIdx: 8 },
    { nama: 'Informatika', guruIdx: 0 },
    { nama: 'Prakarya', guruIdx: 1 },
  ]

  const mapelIds: Record<string, string> = {}
  for (const m of mapelList) {
    let mapel = await prisma.mapel.findFirst({ where: { nama_mapel: m.nama } })
    if (!mapel) {
      mapel = await prisma.mapel.create({ data: { nama_mapel: m.nama, guruId: guruIds[m.guruIdx] } })
    }
    mapelIds[m.nama] = mapel.id
  }
  console.log(`Created ${mapelList.length} mapel`)

  // Create 120 siswa (20 per kelas)
  let siswaCounter = 0
  const allSiswa: { id: string; nama: string; nisn: string; kelasId: string }[] = []

  for (const kelasNama of Object.keys(kelasMap)) {
    const kelasId = kelasMap[kelasNama]
    for (let i = 0; i < 20; i++) {
      siswaCounter++
      const jk = i % 2 === 0 ? 'L' : 'P'
      const nama = generateNama(jk)
      const nisn = generateNISN(siswaCounter)

      const siswa = await prisma.siswa.create({
        data: {
          nisn,
          nama,
          jenis_kelamin: jk,
          tanggal_lahir: generateTglLahir(),
          alamat: `${pickRandom(jalan)} No. ${randomInt(1, 100)}`,
          no_hp: `08${randomInt(1000000000, 9999999999)}`,
          kelasId,
          user: {
            create: {
              email: `${nisn}@student.sch.id`,
              password: await bcrypt.hash('siswa123', 10),
              name: nama,
              role: 'SISWA'
            }
          }
        }
      })
      allSiswa.push({ id: siswa.id, nama, nisn, kelasId })
    }
    console.log(`Created 20 siswa for kelas ${kelasNama}`)
  }
  console.log(`Created ${allSiswa.length} siswa total`)

  // Create nilai (2 mapel per siswa)
  const existingNilai = await prisma.nilai.findFirst()
  if (!existingNilai) {
    for (const siswa of allSiswa) {
      const mapelNames = pickRandom([['Matematika', 'Bahasa Indonesia'], ['Matematika', 'IPA'], ['Bahasa Inggris', 'IPS']])
      for (const mapelName of mapelNames) {
        await prisma.nilai.create({
          data: {
            siswaId: siswa.id,
            mapelId: mapelIds[mapelName],
            nilai: randomInt(65, 98),
            semester: pickRandom(['Ganjil', 'Genap'])
          }
        })
      }
    }
    console.log('Created sample nilai')
  }

  // Create jadwal
  const existingJadwal = await prisma.jadwal.findFirst()
  if (!existingJadwal) {
    const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
    const jamList = ['07:00', '08:30', '10:00', '11:30', '13:00']
    const jamSelesaiList = ['08:15', '09:45', '11:15', '12:45', '14:15']

    for (const kelasNama of Object.keys(kelasMap)) {
      const kelasId = kelasMap[kelasNama]
      const shuffledMapel = [...mapelList].sort(() => 0.5 - Math.random()).slice(0, 5)
      for (let d = 0; d < 5; d++) {
        const m = shuffledMapel[d]
        await prisma.jadwal.create({
          data: {
            kelasId,
            mapelId: mapelIds[m.nama],
            guruId: guruIds[m.guruIdx],
            hari: hariList[d],
            jam_mulai: jamList[d],
            jam_selesai: jamSelesaiList[d]
          }
        })
      }
    }
    console.log('Created jadwal for all kelas')
  }

  // Create blog posts
  const blogTitles = [
    'Kegiatan Ekstrakurikuler di SMP Santa Maria',
    'Prestasi Siswa dalam Olimpiade Matematika',
    'Workshop Teknologi Pembelajaran untuk Guru',
    'Perayaan Hari Pendidikan Nasional',
    'Program Literasi Sekolah: Membaca untuk Masa Depan',
    'Kunjungan Studi ke Museum Nasional',
    'Seminar Kesehatan Mental Remaja',
    'Lomba Debat Bahasa Inggris Antar SMP',
    'Pentas Seni Akhir Tahun 2025',
    'Pelatihan Coding dan Robotika untuk Siswa',
    'Bakti Sosial Siswa di Panti Asuhan',
    'Turnamen Olahraga Antar Kelas',
    'Kegiatan Pramuka dan Kepemimpinan Siswa',
    'Festival Sains dan Teknologi Sekolah',
    'Peringatan Hari Guru Nasional',
    'Kegiatan Outbound dan Team Building',
    'Program Adiwiyata: Sekolah Ramah Lingkungan',
    'Pelatihan Public Speaking untuk Siswa',
    'Perayaan HUT Kemerdekaan RI di Sekolah',
    'Penerimaan Rapor Semester Genap'
  ]

  const loremParagraphs = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
    'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.',
    'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.',
    'Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.'
  ]

  for (let i = 0; i < blogTitles.length; i++) {
    const slug = blogTitles[i].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    const existing = await prisma.blogPost.findFirst({ where: { slug } })
    if (!existing) {
      const numParagraphs = 3 + randomInt(0, 2)
      const shuffled = [...loremParagraphs].sort(() => 0.5 - Math.random())
      const content = shuffled.slice(0, numParagraphs).join('\n\n')
      const randomDays = randomInt(1, 60)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - randomDays)

      await prisma.blogPost.create({
        data: {
          title: blogTitles[i],
          slug,
          content,
          status: i < 15 ? 'publish' : 'draft',
          createdAt,
          thumbnail: i % 3 === 0 ? `https://picsum.photos/seed/blog${i}/800/400` : undefined
        }
      })
    }
  }
  console.log('Created 20 dummy blog posts')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
