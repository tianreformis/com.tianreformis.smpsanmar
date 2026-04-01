import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@sekolah.sch.id' } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@sekolah.sch.id',
        password: hashedPassword,
        name: 'Administrator',
        role: 'ADMIN'
      }
    })
  }
  console.log('Created admin: admin@sekolah.sch.id')

  // Create guru
  const guru1 = await prisma.guru.upsert({
    where: { nip: '198501012010011001' },
    update: {},
    create: {
      nip: '198501012010011001',
      nama: 'Dr. Budi Santoso, M.Pd.',
      email: 'budi.santoso@sekolah.sch.id',
      no_hp: '081234567890',
      alamat: 'Jl. Merdeka No. 10, Jakarta'
    }
  })

  const guru2 = await prisma.guru.upsert({
    where: { nip: '198702152012012002' },
    update: {},
    create: {
      nip: '198702152012012002',
      nama: 'Siti Aminah, S.Pd.',
      email: 'siti.aminah@sekolah.sch.id',
      no_hp: '081234567891',
      alamat: 'Jl. Sudirman No. 25, Bandung'
    }
  })

  const guru3 = await prisma.guru.upsert({
    where: { nip: '199005202015012003' },
    update: {},
    create: {
      nip: '199005202015012003',
      nama: 'Ahmad Hidayat, S.Si.',
      email: 'ahmad.hidayat@sekolah.sch.id',
      no_hp: '081234567892',
      alamat: 'Jl. Gatot Subroto No. 30, Surabaya'
    }
  })
  console.log('Created 3 guru')

  // Create user for guru1
  const existingGuruUser = await prisma.user.findUnique({ where: { email: guru1.email } })
  if (!existingGuruUser) {
    await prisma.user.create({
      data: {
        email: guru1.email,
        password: await bcrypt.hash('guru123', 10),
        name: guru1.nama,
        role: 'GURU',
        guruId: guru1.id
      }
    })
  }

  // Create kelas
  const kelasXIPA1 = await prisma.kelas.upsert({
    where: { nama_kelas: 'X IPA 1' },
    update: {},
    create: {
      nama_kelas: 'X IPA 1',
      waliKelasId: guru1.id
    }
  })

  const kelasXIPA2 = await prisma.kelas.upsert({
    where: { nama_kelas: 'X IPA 2' },
    update: {},
    create: {
      nama_kelas: 'X IPA 2',
      waliKelasId: guru2.id
    }
  })

  const kelasXIPS = await prisma.kelas.upsert({
    where: { nama_kelas: 'X IPS' },
    update: {},
    create: {
      nama_kelas: 'X IPS',
      waliKelasId: guru3.id
    }
  })
  console.log('Created 3 kelas')

  // Create mapel using findOrCreate pattern
  async function findOrCreateMapel(nama: string, guruId: string | null) {
    let mapel = await prisma.mapel.findFirst({ where: { nama_mapel: nama } })
    if (!mapel) {
      mapel = await prisma.mapel.create({
        data: { nama_mapel: nama, guruId }
      })
    }
    return mapel
  }

  const mapelMatematika = await findOrCreateMapel('Matematika', guru1.id)
  const mapelBIndo = await findOrCreateMapel('Bahasa Indonesia', guru2.id)
  const mapelFisika = await findOrCreateMapel('Fisika', guru3.id)
  const mapelKimia = await findOrCreateMapel('Kimia', guru1.id)
  const mapelBiologi = await findOrCreateMapel('Biologi', guru2.id)
  console.log('Created 5 mapel')

  // Create siswa
  const siswa1 = await prisma.siswa.upsert({
    where: { nisn: '0012345678' },
    update: {},
    create: {
      nisn: '0012345678',
      nama: 'Rina Marlina',
      jenis_kelamin: 'P',
      tanggal_lahir: new Date('2010-03-15'),
      alamat: 'Jl. Melati No. 5, Jakarta',
      no_hp: '085678901234',
      kelasId: kelasXIPA1.id
    }
  })

  const siswa2 = await prisma.siswa.upsert({
    where: { nisn: '0012345679' },
    update: {},
    create: {
      nisn: '0012345679',
      nama: 'Fajar Nugroho',
      jenis_kelamin: 'L',
      tanggal_lahir: new Date('2010-07-22'),
      alamat: 'Jl. Anggrek No. 12, Bandung',
      no_hp: '085678901235',
      kelasId: kelasXIPA1.id
    }
  })

  const siswa3 = await prisma.siswa.upsert({
    where: { nisn: '0012345680' },
    update: {},
    create: {
      nisn: '0012345680',
      nama: 'Dewi Lestari',
      jenis_kelamin: 'P',
      tanggal_lahir: new Date('2010-11-08'),
      alamat: 'Jl. Kenanga No. 8, Surabaya',
      no_hp: '085678901236',
      kelasId: kelasXIPA2.id
    }
  })

  await prisma.siswa.upsert({
    where: { nisn: '0012345681' },
    update: {},
    create: {
      nisn: '0012345681',
      nama: 'Andi Pratama',
      jenis_kelamin: 'L',
      tanggal_lahir: new Date('2010-05-30'),
      alamat: 'Jl. Mawar No. 15, Semarang',
      no_hp: '085678901237',
      kelasId: kelasXIPS.id
    }
  })
  console.log('Created 4 siswa')

  // Create user for siswa
  const existingSiswaUser = await prisma.user.findUnique({ where: { email: 'rina.marlina@student.sch.id' } })
  if (!existingSiswaUser) {
    await prisma.user.create({
      data: {
        email: 'rina.marlina@student.sch.id',
        password: await bcrypt.hash('siswa123', 10),
        name: siswa1.nama,
        role: 'SISWA',
        siswaId: siswa1.id
      }
    })
  }

  // Create nilai (individual create for SQLite)
  const existingNilai = await prisma.nilai.findFirst()
  if (!existingNilai) {
    await prisma.nilai.create({ data: { siswaId: siswa1.id, mapelId: mapelMatematika.id, nilai: 85, semester: 'Ganjil' } })
    await prisma.nilai.create({ data: { siswaId: siswa1.id, mapelId: mapelBIndo.id, nilai: 90, semester: 'Ganjil' } })
    await prisma.nilai.create({ data: { siswaId: siswa1.id, mapelId: mapelFisika.id, nilai: 88, semester: 'Ganjil' } })
    await prisma.nilai.create({ data: { siswaId: siswa2.id, mapelId: mapelMatematika.id, nilai: 78, semester: 'Ganjil' } })
    await prisma.nilai.create({ data: { siswaId: siswa2.id, mapelId: mapelBIndo.id, nilai: 82, semester: 'Ganjil' } })
    await prisma.nilai.create({ data: { siswaId: siswa3.id, mapelId: mapelMatematika.id, nilai: 92, semester: 'Ganjil' } })
    await prisma.nilai.create({ data: { siswaId: siswa3.id, mapelId: mapelBiologi.id, nilai: 95, semester: 'Ganjil' } })
  }
  console.log('Created sample nilai')

  // Create jadwal (individual create for SQLite)
  const existingJadwal = await prisma.jadwal.findFirst()
  if (!existingJadwal) {
    await prisma.jadwal.create({ data: { kelasId: kelasXIPA1.id, mapelId: mapelMatematika.id, guruId: guru1.id, hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30' } })
    await prisma.jadwal.create({ data: { kelasId: kelasXIPA1.id, mapelId: mapelBIndo.id, guruId: guru2.id, hari: 'Senin', jam_mulai: '08:45', jam_selesai: '10:15' } })
    await prisma.jadwal.create({ data: { kelasId: kelasXIPA1.id, mapelId: mapelFisika.id, guruId: guru3.id, hari: 'Selasa', jam_mulai: '07:00', jam_selesai: '08:30' } })
    await prisma.jadwal.create({ data: { kelasId: kelasXIPA1.id, mapelId: mapelKimia.id, guruId: guru1.id, hari: 'Rabu', jam_mulai: '09:00', jam_selesai: '10:30' } })
    await prisma.jadwal.create({ data: { kelasId: kelasXIPA1.id, mapelId: mapelBiologi.id, guruId: guru2.id, hari: 'Kamis', jam_mulai: '07:00', jam_selesai: '08:30' } })
  }
  console.log('Created sample jadwal')

  // Create blog posts
  const existingBlog = await prisma.blogPost.findFirst({ where: { slug: 'selamat-datang-di-sekolah-kami' } })
  if (!existingBlog) {
    await prisma.blogPost.create({
      data: {
        title: 'Selamat Datang di Sekolah Kami',
        slug: 'selamat-datang-di-sekolah-kami',
        content: 'Assalamualaikum Warahmatullahi Wabarakatuh.\n\nSelamat datang di website resmi sekolah kami. Melalui website ini, kami berharap dapat memberikan informasi yang bermanfaat bagi seluruh civitas akademika dan masyarakat umum.\n\nSekolah kami berkomitmen untuk memberikan pendidikan berkualitas yang berfokus pada pengembangan karakter dan kompetensi siswa.\n\nHormat kami,\nKepala Sekolah',
        status: 'publish'
      }
    })
  }

  const existingBlog2 = await prisma.blogPost.findFirst({ where: { slug: 'pendaftaran-siswa-baru-2026' } })
  if (!existingBlog2) {
    await prisma.blogPost.create({
      data: {
        title: 'Pendaftaran Siswa Baru Tahun 2026',
        slug: 'pendaftaran-siswa-baru-2026',
        content: 'Pendaftaran siswa baru tahun ajaran 2026/2027 telah dibuka.\n\nPersyaratan:\n1. Usia minimal 12 tahun\n2. Lulus SD/MI\n3. Mengisi formulir pendaftaran\n4. Menyerahkan fotokopi Akta Kelahiran\n5. Menyerahkan fotokopi Kartu Keluarga\n\nPendaftaran dapat dilakukan secara online melalui website ini.',
        status: 'publish'
      }
    })
  }
  console.log('Created sample blog posts')

  const blogTitles = [
    'Kegiatan Ekstrakurikuler di SMP Santa Maria',
    'Prestasi Siswa dalam Olimpiade Matematika Nasional',
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
    'Program Pertukaran Pelajar dengan Sekolah Jepang',
    'Kegiatan Pramuka dan Kepemimpinan Siswa',
    'Festival Sains dan Teknologi Sekolah',
    'Peringatan Hari Guru Nasional',
    'Kegiatan Outbound dan Team Building',
    'Program Adiwiyata: Sekolah Ramah Lingkungan',
    'Pelatihan Public Speaking untuk Siswa',
    'Perayaan HUT Kemerdekaan RI di Sekolah'
  ]

  const loremParagraphs = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
    'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio.',
    'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.',
    'Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.'
  ]

  for (let i = 0; i < blogTitles.length; i++) {
    const existing = await prisma.blogPost.findFirst({
      where: { slug: blogTitles[i].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') }
    })

    if (!existing) {
      const numParagraphs = 3 + Math.floor(Math.random() * 3)
      const shuffled = [...loremParagraphs].sort(() => 0.5 - Math.random())
      const content = shuffled.slice(0, numParagraphs).join('\n\n')

      const randomDays = Math.floor(Math.random() * 60)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - randomDays)

      await prisma.blogPost.create({
        data: {
          title: blogTitles[i],
          slug: blogTitles[i].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
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
