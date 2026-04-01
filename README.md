# Sistem Manajemen Sekolah (SMS)

Aplikasi web fullstack untuk manajemen sekolah dengan fitur lengkap untuk admin, guru, dan siswa.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes (REST)
- **Database**: SQLite dengan Prisma ORM
- **Auth**: NextAuth.js (Credential Provider)

## Fitur

### Role-based Access
- **Admin**: Full akses ke semua fitur
- **Guru**: Melihat kelas, input nilai
- **Siswa**: Melihat data diri dan nilai

### Modul
- Dashboard dengan statistik dan grafik
- Manajemen Siswa (CRUD, export PDF/Excel)
- Manajemen Guru
- Manajemen Kelas
- Manajemen Mata Pelajaran
- Jadwal Pelajaran
- Input & Manajemen Nilai
- PPDB (Penerimaan Siswa Baru) - Form online
- Blog / Berita Sekolah

## Instalasi

```bash
# Clone / Extract project
cd school-management

# Install dependencies
npm install

# File .env sudah tersedia, lanjutkan ke step berikutnya

# Generate Prisma client
npx prisma generate

# Create database
npx prisma db push

# Seed sample data
npm run db:seed

# Run development server
npm run dev
```

> **Atau gunakan shortcut setup:**
> ```bash
> npm run setup
> ```

> **Buka browser:** http://localhost:3000

## Default Login

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | admin@sekolah.sch.id         | admin123   |
| Guru  | budi.santoso@sekolah.sch.id | guru123    |
| Siswa | rina.marlina@student.sch.id | siswa123   |

## Struktur Folder

``
├── app/
│   ├── api/           # API Routes
│   ├── dashboard/     # Dashboard pages
│   ├── login/        # Login page
│   ├── ppdb/         # Public PPDB page
│   └── blog/         # Public blog pages
├── components/
│   ├── ui/           # Shadcn UI components
│   └── dashboard/    # Dashboard components
├── lib/              # Utilities
├── prisma/           # Database schema & seed
└── types/            # TypeScript types
```

## API Endpoints

| Endpoint       | Method | Deskripsi              |
|----------------|--------|------------------------|
| /api/auth      | GET   | Auth routes            |
| /api/siswa     | GET, POST | List/Create siswa  |
| /api/siswa/:id | GET, PUT, DELETE | CRUD siswa |
| /api/guru      | GET, POST | List/Create guru   |
| /api/kelas     | GET, POST | List/Create kelas  |
| /api/mapel     | GET, POST | List/Create mapel  |
| /api/jadwal    | GET, POST | List/Create jadwal |
| /api/nilai     | GET, POST | List/Create nilai  |
| /api/ppdb      | GET, POST | List/Create ppdb  |
| /api/blog      | GET, POST | List/Create blog  |
| /api/stats     | GET   | Dashboard statistics  |

### Query Parameters
- `?page=1&limit=10` - Pagination
- `?search=keyword` - Search
- `?status=pending` - Filter by status

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Database Schema

![ERD](docs/erd.png)

Model: User, Siswa, Guru, Kelas, Mapel, Jadwal, Nilai, PPDB, BlogPost, ActivityLog

## Lisensi

MIT License
