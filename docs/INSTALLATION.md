# Panduan Instalasi School Management System

Panduan detail untuk instalasi dan setup project.

## Prasyarat

- Node.js 18.x atau lebih baru
- npm atau yarn
- Git (untuk cloning)

## Langkah Instalasi

### 1. Clone atau Extract Project

```bash
cd school-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variable

Copy file environment dari contoh:

```bash
# Windows
copy prisma\.env .env

# Linux/Mac
cp prisma/.env .env
```

Edit file `.env` dan sesuaikan:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Create Database

```bash
npm run db:push
```

Ini akan membuat database SQLite dan menjalankan semua migration.

### 6. Seed Sample Data

```bash
npm run db:seed
```

Akan membuat:
- 3 user (admin, guru, siswa)
- 5 siswa sample
- 3 guru sample
- 3 kelas
- 5 mata pelajaran
- jadwal pelajaran
- nilai sample
- data blog

### 7. Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000

## Default Login Credentials

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | admin@sekolah.sch.id         | admin123   |
| Guru  | budi.santoso@sekolah.sch.id | guru123    |
| Siswa | rina.marlina@student.sch.id | siswa123   |

## Struktur Database

### Models

- **User**: Akun login (admin, guru, siswa)
- **Siswa**: Data siswa
- **Guru**: Data guru
- **Kelas**: Kelas dan wali kelas
- **Mapel**: Mata pelajaran
- **Jadwal**: Jadwal pelajaran
- **Nilai**: Nilai siswa per mapel
- **PPDB**: Pendaftaran siswa baru
- **BlogPost**: Artikel/berita sekolah
- **ActivityLog**: Log aktivitas user

### Relasi

```
User (1) ----< (1) Siswa
User (1) ----< (1) Guru
Kelas (1) ----< (many) Siswa
Kelas (1) ----< (many) Jadwal
Guru (1) ----< (many) Jadwal
Mapel (1) ----< (many) Jadwal
Mapel (1) ----< (many) Nilai
Siswa (1) ----< (many) Nilai
```

## Common Commands

```bash
# Development
npm run dev

# Build production
npm run build

# Start production
npm start

# Database operations
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed sample data

# Linting
npm run lint
```

## Troubleshooting

### Error: Prisma Client not found

```bash
npm run db:generate
```

### Error: Cannot find module

```bash
npm install
```

### Reset Database

```bash
# Hapus database
del prisma\dev.db

# Recreate
npm run db:push
npm run db:seed
```

### Clear all data (soft reset)

Jalankan seed ulang:

```bash
npm run db:seed
```

## Deploy ke Production

### Vercel (Recommended)

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
4. Deploy

### Manual Server

```bash
npm run build
npm run db:push
npm run db:seed
npm start
```

## Support

Untuk bantuan, buat issue di repository.
