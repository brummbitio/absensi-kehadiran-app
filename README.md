# Sistem Absensi Kehadiran

Aplikasi web fullstack untuk pengelolaan absensi karyawan menggunakan teknologi QR Code dengan sistem keamanan HMAC-SHA256.

## Fitur Utama

### Autentikasi & Otorisasi
- Login dengan JWT (Access Token & Refresh Token)
- Session management dengan automatic token refresh
- Role-based access control

### Manajemen Karyawan
- CRUD karyawan lengkap
- Import data karyawan via CSV
- Generate QR Code untuk setiap karyawan
- QR Code signed dengan HMAC-SHA256 untuk keamanan

### Sistem Absensi
- Scan QR Code via browser (camera access)
- Validasi HMAC signature untuk mencegah pemalsuan
- Duplicate prevention (1 karyawan hanya bisa absen 1x per hari)
- Automatic blocking untuk hari weekend dan libur nasional
- Timestamp otomatis dengan timezone Indonesia (Asia/Jakarta)

### Manajemen Hari Libur
- CRUD hari libur/cuti bersama
- Blocking absensi otomatis di hari libur

### Pelaporan
- Rekap bulanan per karyawan
- Detail kehadiran dengan dropdown interaktif (tanggal-tanggal spesifik)
- Export data absensi ke CSV
- Filter berdasarkan bulan dan tahun

### Sistem Pendukung
- Structured logging dengan Winston
- Unit testing dengan Jest
- Git discipline dengan Conventional Commits
- Request logging dan error handling

## Arsitektur Sistem

### Backend Architecture

Backend menggunakan arsitektur RESTful API dengan pattern MVC (Model-View-Controller):

```
Client Request
     ↓
Middleware (Auth, Logging, Rate Limiting)
     ↓
Routes → Controllers → Services → Models
     ↓
Database (MySQL)
```

**Komponen Utama:**
- **Middleware**: Authentication, Request Logging, Rate Limiting
- **Controllers**: Menangani HTTP request/response
- **Services**: Business logic dan validasi
- **Models**: Database interaction
- **Utils**: Helper functions, logger, QR generator

### Frontend Architecture

Frontend menggunakan Next.js 16 dengan App Router:

```
Pages (App Router)
     ↓
Components (UI Components + Layout)
     ↓
API Client (Axios with interceptors)
     ↓
Backend API
```

**Komponen Utama:**
- **App Router**: Route-based navigation
- **Auth Context**: Global authentication state
- **UI Components**: Shadcn/UI components
- **API Client**: Axios dengan token interceptor

### QR Code & HMAC System

**QR Code Generation:**
```
Employee ID → JSON Payload → HMAC Signature → Combined Payload → QR Code
```

**Payload Structure:**
```json
{
  "employee_id": "EMP001",
  "name": "John Doe",
  "signature": "hmac_sha256_hash"
}
```

**Verification Process:**
1. Scan QR Code → Parse JSON
2. Extract signature dan employee_id
3. Generate HMAC signature dari employee_id menggunakan server secret
4. Compare signature: jika match → valid, jika tidak → rejected
5. Check duplicate, weekend, holiday
6. Insert ke database

### Attendance Calculation

**Logika Perhitungan:**
1. **Working Days**: Senin - Jumat (exclude weekend)
2. **Holiday Check**: Cross-check dengan tabel holidays
3. **Attendance Rate**: `(Total Hadir / Total Hari Kerja) * 100%`
4. **Status**:
   - Hadir: Ada record absensi
   - Tidak Hadir: Hari kerja tanpa record absensi
   - Libur: Weekend atau holiday (tidak dihitung)

**Detail Attendance Tracking:**
- Sistem menyimpan tanggal spesifik untuk setiap kehadiran
- UI rekap bulanan menampilkan dropdown interaktif per karyawan
- Saat baris karyawan diklik, muncul detail tanggal-tanggal kehadiran
- Format tanggal: `Sen, 16 Feb 2026` (Indonesia locale)
- Visual indicator: border hijau untuk hari hadir

## Teknologi

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: MySQL 8
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Utilities**: 
  - Multer (file upload)
  - PapaParse (CSV parsing)
  - UUID (identifier generation)
  - Express Rate Limit

### Frontend
- **Framework**: Next.js 16.1.6
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/UI (Radix UI  + CVA)
- **QR Scanner**: @yudiel/react-qr-scanner
- **QR Generator**: qrcode.react
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Date Utilities**: date-fns

### Development Tools
- **Git Hooks**: Husky
- **Commit Linting**: Commitlint (Conventional Commits)
- **Package Manager**: npm
- **TypeScript**: v5.9+

## Struktur Folder

### Backend (`absensi-kehadiran-be/`)

```
absensi-kehadiran-be/
├── src/
│   ├── config/
│   │   └── db.ts                 # MySQL connection pool
│   ├── controllers/              # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── holiday.controller.ts
│   │   └── report.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT verification
│   │   └── request-logger.middleware.ts
│   ├── models/                   # Database models
│   │   ├── employee.model.ts
│   │   ├── attendance.model.ts
│   │   └── holiday.model.ts
│   ├── routes/                   # API routes
│   │   ├── auth.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── holiday.routes.ts
│   │   └── report.routes.ts
│   ├── services/                 # Business logic
│   │   ├── auth.service.ts
│   │   ├── employee.service.ts
│   │   ├── attendance.service.ts
│   │   ├── holiday.service.ts
│   │   ├── report.service.ts
│   │   ├── qr.service.ts
│   │   └── otentikasi.service.ts
│   ├── utils/
│   │   ├── logger.ts             # Winston logger
│   │   └── seed.ts               # Database seeder
│   ├── app.ts                    # Express app config
│   └── server.ts                 # Server entry point
├── scripts/
│   ├── init_db.ts                # Database initialization
│   ├── setup_infra.ts            # Infrastructure setup
│   └── test_scan.ts              # QR scan testing
├── tests/
│   └── unit/                     # Unit tests
│       ├── auth.service.test.ts
│       ├── attendance.service.test.ts
│       └── qr.service.test.ts
├── uploads/                      # CSV upload directory
├── .env                          # Environment variables
├── .husky/                       # Git hooks
├── commitlint.config.js
├── jest.config.js
├── tsconfig.json
└── package.json
```

### Frontend (`absensi-kehadiran-fe/`)

```
absensi-kehadiran-fe/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── employees/
│   │   │   └── page.tsx          # Employee management
│   │   ├── attendance/
│   │   │   ├── scan/
│   │   │   │   └── page.tsx      # QR scan page
│   │   │   └── recap/
│   │   │       └── page.tsx      # Attendance recap
│   │   └── holidays/
│   │       └── page.tsx          # Holiday management
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage (redirect)
├── components/
│   ├── ui/                       # Shadcn/UI components
│   ├── layout/
│   │   └── Sidebar.tsx
│   ├── attendance/
│   │   └── ScanResultCard.tsx
│   └── tables/
│       └── EmployeeTable.tsx
├── lib/
│   ├── api.ts                    # Axios client
│   ├── auth-context.tsx          # Auth provider
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
├── public/                       # Static assets
├── types/                        # Type declarations
├── .env.local                    # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Instalasi

### Prerequisites

- Node.js >= 20.x
- MySQL >= 8.0
- npm >= 10.x

### 1. Clone Repository

```bash
git clone https://github.com/brummbitio/absensi-kehadiran-app.git
cd absensi-kehadiran
```

### 2. Install Dependencies

**Backend:**
```bash
cd absensi-kehadiran-be
npm install
```

**Frontend:**
```bash
cd absensi-kehadiran-fe
npm install
```

### 2.1 Import Data Karyawan (CSV)

Sistem mendukung import bulk karyawan via CSV. Format file CSV:

```csv
name,identity_number,division
Budi Santoso,3201012345678901,IT
Siti Nurhaliza,3202023456789012,HR
Ahmad Hidayat,3203034567890123,Finance
```

**Kolom yang diperlukan:**
- `name` - Nama lengkap karyawan
- `identity_number` - NIK/Nomor identitas (harus unik)
- `division` - Divisi/departemen

**Catatan:**
- File contoh tersedia di `sample_employees.csv`
- Header baris pertama wajib ada (name,identity_number,division)
- Identity number harus unik, duplikat akan di-skip
- Sistem akan otomatis generate QR Code untuk setiap karyawan

### 3. Setup Database

1. Buat database MySQL:
```sql
CREATE DATABASE daily_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Jalankan script inisialisasi:
```bash
cd absensi-kehadiran-be
npx ts-node scripts/init_db.ts
```

Script ini akan:
- Membuat semua tabel (users, employees, attendance, holidays)
- Insert data admin default
- Insert sample employees (opsional)

## Konfigurasi

### Backend Environment (.env)

Buat file `.env` di `absensi-kehadiran-be/`:

```env
# Server Configuration
PORT=4000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=daily_attendance

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Timezone
TZ=Asia/Jakarta
```

**Catatan Keamanan:**
- Ganti `JWT_SECRET` dan `REFRESH_SECRET` dengan string random yang kuat
- Jangan commit file `.env` ke repository
- Gunakan environment variables berbeda untuk production

### Frontend Environment (.env.local)

Buat file `.env.local` di `absensi-kehadiran-fe/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Menjalankan Aplikasi

### Development Mode

**Backend:**
```bash
cd absensi-kehadiran-be
npm run dev
```
Server akan berjalan di `http://localhost:4000`

**Frontend:**
```bash
cd absensi-kehadiran-fe
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`

**Login Default:**
- Email: `admin@absensi.com`
- Password: `admin`

### Production Mode

**Backend:**
```bash
cd absensi-kehadiran-be
npm run build
npm start
```

**Frontend:**
```bash
cd absensi-kehadiran-fe
npm run build
npm start
```

### Available Scripts

**Backend:**
- `npm run dev` - Development server dengan hot reload
- `npm run build` - Compile TypeScript ke JavaScript
- `npm start` - Run production server
- `npm test` - Run unit tests
- `npm run lint` - Run ESLint

**Frontend:**
- `npm run dev` - Development server dengan hot reload
- `npm run build` - Build untuk production
- `npm start` - Run production server
- `npm run lint` - Run ESLint

## Testing

### Backend Unit Tests

**Menjalankan semua test:**
```bash
cd absensi-kehadiran-be
npm test
```

**Test coverage:**
```bash
npm test -- --coverage
```

**Test suites yang tersedia:**
- `auth.service.test.ts` - Testing authentication logic
- `attendance.service.test.ts` - Testing attendance calculation
- `qr.service.test.ts` - Testing QR generation & verification

**Contoh test case:**
- Login dengan credentials valid/invalid
- Token generation dan verification
- QR signature generation dan validation
- Duplicate attendance prevention
- Weekend dan holiday blocking
- Attendance calculation

### Testing Framework

- **Jest** - Test runner
- **Supertest** - HTTP assertion
- **Mocking** - Database dan external dependencies

## Logging System

### Backend Logging (Winston)

**Log Levels:**
- `error` - Critical errors
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug information

**Log Format:**
```json
{
  "level": "info",
  "message": "Incoming Request",
  "method": "POST",
  "url": "/api/auth/login",
  "ip": "::1",
  "userAgent": "Mozilla/5.0...",
  "requestId": "uuid-v4",
  "timestamp": "2024-02-16T05:30:00.000Z"
}
```

**Request Logging:**
Setiap request akan dicatat dengan:
- Request ID (UUID)
- Method, URL, IP Address
- User Agent
- Response status code
- Duration

**Log Output:**
- Console - untuk development
- File - untuk production (opsional)

## Git Workflow

### Conventional Commits

Proyek ini menggunakan **Conventional Commits** untuk pesan commit yang terstruktur.

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types yang digunakan:**
- `feat`: Fitur baru
- `fix`: Bug fix
- `docs`: Dokumentasi
- `style`: Formatting, semicolons, etc
- `refactor`: Code refactoring
- `test`: Menambah atau update tests
- `chore`: Maintenance tasks

**Contoh:**
```bash
git commit -m "feat(auth): implement JWT refresh token mechanism"
git commit -m "fix(attendance): prevent duplicate scan on same day"
git commit -m "docs(readme): update installation instructions"
```

### Git Hooks (Husky)

**Pre-commit hook:**
- Belum dikonfigurasi (dapat ditambahkan linting, type-check)

**Commit-msg hook:**
- Validasi format commit message menggunakan Commitlint
- Reject commit jika format tidak sesuai Conventional Commits

**Setup:**
```bash
cd absensi-kehadiran-be
npm run prepare  # Install husky hooks
```

## Security

### Implementasi Keamanan

1. **Authentication**
   - JWT dengan expiry time
   - Refresh token mechanism
   - Password hashing dengan bcrypt (10 rounds)

2. **QR Code Security**
   - HMAC-SHA256 signature
   - Payload validation
   - Timestamp check (opsional, dapat ditambahkan)

3. **HTTP Security**
   - Helmet.js untuk security headers
   - CORS configuration
   - Rate limiting untuk prevent abuse

4. **Input Validation**
   - Type checking dengan TypeScript
   - Data validation di service layer
   - SQL injection prevention (parameterized queries)

5. **Error Handling**
   - Generic error messages untuk user
   - Detailed logging untuk debugging
   - No stack trace leak di production

### Security Best Practices

**Untuk Production:**
1. Ganti semua default secrets
2. Gunakan HTTPS
3. Enable rate limiting lebih ketat
4. Implement request size limits
5. Regular dependency updates
6. Database backup otomatis
7. Logging monitoring dan alerting

## Deployment

### Backend Deployment

**Prerequisites:**
- VPS atau cloud server (DigitalOcean, AWS, GCP, dll)
- MySQL database
- Node.js runtime
- Process manager (PM2 recommended)

**Steps:**
1. Setup database di server
2. Clone repository
3. Install dependencies: `npm install --production`
4. Build aplikasi: `npm run build`
5. Setup environment variables
6. Jalankan dengan PM2:
   ```bash
   pm2 start dist/server.js --name "absensi-kehadiran-api"
   ```
7. Setup reverse proxy (Nginx)

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend Deployment

**Option 1: Vercel (Recommended)**
1. Push repository ke GitHub
2. Import project di Vercel
3. Configure environment variables
4. Deploy

**Option 2: Self-hosted**
1. Build aplikasi: `npm run build`
2. Jalankan dengan PM2:
   ```bash
   pm2 start npm --name "absensi-kehadiran-web" -- start
   ```
3. Setup Nginx reverse proxy

### Database Migration

Untuk production, gunakan migration tool seperti:
- Knex.js migrations
- Sequelize migrations
- Custom SQL migration scripts

### Environment Variables Production

Pastikan set environment variables yang aman:
- Generate JWT secret dengan: `openssl rand -base64 32`
- Gunakan strong database password
- Set `NODE_ENV=production`
- Configure production database connection

## Developer

**Proyek ini dikembangkan oleh:**
- Nama: Fernando Putra
- Email: fernandoputra1125@gmail.com
- Role: Fullstack Developer
- Tahun: 2026

**Tech Stack Expertise:**
- Backend: Node.js, Express, TypeScript, MySQL
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- DevOps: Git, PM2, Nginx, Linux

**Repository:**
- GitHub: [\[repository-url\]](https://github.com/brummbitio/absensi-kehadiran-app.git)
- Documentation: Lihat folder `/docs` untuk dokumentasi tambahan

---

# absensi-kehadiran-app
