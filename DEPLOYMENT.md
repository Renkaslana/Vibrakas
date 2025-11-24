# Panduan Deployment ke Vercel

## ⚠️ PENTING: Database Migration

**Saat ini project menggunakan SQLite yang TIDAK cocok untuk production di Vercel.**

SQLite adalah file-based database yang:
- ❌ Tidak persisten di Vercel (ephemeral filesystem)
- ❌ Akan hilang setiap deployment
- ❌ Tidak support concurrent writes

**SOLUSI: Gunakan PostgreSQL atau MySQL untuk production**

---

## 📋 Checklist Sebelum Deploy

### ✅ 1. Database Setup (WAJIB)

Pilih salah satu opsi:

#### Opsi A: Vercel Postgres (Recommended - Mudah)
1. Di Vercel Dashboard → Storage → Create Database → Postgres
2. Copy connection string
3. Format: `postgresql://user:password@host:5432/database?sslmode=require`

#### Opsi B: Supabase (Gratis & Recommended)
1. Daftar di https://supabase.com
2. Buat project baru
3. Copy connection string dari Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Opsi C: PlanetScale (MySQL - Gratis)
1. Daftar di https://planetscale.com
2. Buat database baru
3. Copy connection string
4. Format: `mysql://user:password@host:3306/database`

### ✅ 2. Update Prisma Schema (Jika perlu)

Jika menggunakan MySQL, ubah `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"  // atau "postgresql"
  url      = env("DATABASE_URL")
}
```

### ✅ 3. Environment Variables

Tambahkan di Vercel Dashboard → Settings → Environment Variables:

#### Wajib:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
NEXTAUTH_SECRET="generate-random-string-min-32-chars"
NEXTAUTH_URL="https://your-app.vercel.app"
```

#### Opsional (jika menggunakan):
```env
# Email SMTP (untuk OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Vibra Kas <your-email@gmail.com>"

# Payment Gateway
PAYMENT_API_KEY="your-api-key"
PAYMENT_SECRET="your-secret"
PAYMENT_MERCHANT_CODE="your-merchant-code"
PAYMENT_BASE_URL="https://tripay.co.id/api"
```

**Cara Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### ✅ 4. Build Configuration

Pastikan `package.json` sudah benar:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### ✅ 5. Update next.config.js

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-domain.vercel.app'],
  },
}

module.exports = nextConfig
```

---

## 🚀 Langkah Deployment

### Step 1: Push ke GitHub

```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy di Vercel

1. Buka https://vercel.com
2. Login dengan GitHub
3. Klik "Add New Project"
4. Import repository Anda
5. Configure Project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (otomatis)
   - **Output Directory**: `.next` (otomatis)
   - **Install Command**: `npm install` (otomatis)

### Step 3: Setup Environment Variables

Di Vercel Dashboard → Project → Settings → Environment Variables:

Tambahkan semua environment variables yang diperlukan (lihat checklist di atas).

**PENTING**: 
- ✅ Centang semua environment (Production, Preview, Development)
- ✅ Set `NEXTAUTH_URL` sesuai domain Anda

### Step 4: Setup Database

#### Jika menggunakan Vercel Postgres:
1. Di Vercel Dashboard → Storage → Create Database → Postgres
2. Copy connection string
3. Tambahkan ke Environment Variables sebagai `DATABASE_URL`

#### Jika menggunakan Supabase:
1. Buat project di Supabase
2. Copy connection string
3. Tambahkan ke Environment Variables sebagai `DATABASE_URL`

### Step 5: Run Database Migration

Setelah deploy pertama kali, jalankan migration:

**Opsi A: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npx prisma db push
```

**Opsi B: Via Vercel Dashboard**
1. Buka Vercel Dashboard → Project → Functions
2. Klik "Run Command"
3. Jalankan: `npx prisma db push`

**Opsi C: Via Supabase Dashboard**
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan migration SQL (jika ada)

### Step 6: Buat Admin Pertama

Setelah database setup, buat admin pertama:

**Opsi A: Via Vercel CLI**
```bash
vercel env pull .env.local
npm run create-admin
```

**Opsi B: Via API (setelah deploy)**
- Register user pertama → otomatis jadi admin (jika tidak ada admin)
- Atau gunakan script create-admin via Vercel Functions

**Opsi C: Manual via Supabase Dashboard**
1. Buka Supabase Dashboard → Table Editor → User
2. Insert manual dengan password yang sudah di-hash

### Step 7: Update Webhook URL (jika menggunakan Payment Gateway)

Setelah deploy, update webhook URL di payment gateway dashboard:
```
https://your-app.vercel.app/api/webhook/payment
```

---

## 🔍 Verifikasi Deployment

### 1. Test Build Locally
```bash
npm run build
```

Jika build berhasil, siap untuk deploy.

### 2. Test di Vercel Preview
- Setelah push ke GitHub, Vercel akan auto-deploy
- Cek preview URL
- Test semua fitur:
  - ✅ Register dengan OTP
  - ✅ Login
  - ✅ Dashboard
  - ✅ Dll

### 3. Check Logs
- Vercel Dashboard → Project → Logs
- Cek error jika ada

---

## 🐛 Troubleshooting

### Error: "Prisma Client not generated"
**Solusi**: Tambahkan `postinstall` script di `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Error: "Database connection failed"
**Solusi**: 
- Pastikan `DATABASE_URL` benar
- Pastikan database sudah dibuat
- Check SSL mode (untuk PostgreSQL, tambahkan `?sslmode=require`)

### Error: "NEXTAUTH_SECRET is missing"
**Solusi**: 
- Generate secret: `openssl rand -base64 32`
- Tambahkan ke Vercel Environment Variables

### Error: "OTP email not sent"
**Solusi**:
- Pastikan SMTP credentials benar
- Check SMTP settings di Vercel Environment Variables
- OTP akan tetap muncul di console log untuk development

### Database tidak ter-update setelah migration
**Solusi**:
- Jalankan `npx prisma db push` lagi
- Atau gunakan `npx prisma migrate deploy` untuk production

---

## 📝 Catatan Penting

1. **Database**: SQLite TIDAK bisa digunakan di Vercel production. WAJIB gunakan PostgreSQL/MySQL.

2. **Environment Variables**: Jangan commit `.env` ke GitHub. Semua secrets harus di-set di Vercel Dashboard.

3. **Build Time**: Pastikan `prisma generate` dijalankan sebelum build (sudah ada di build script).

4. **Admin Account**: Setelah deploy, buat admin pertama via script atau register user pertama (auto-admin).

5. **HTTPS**: Vercel otomatis provide HTTPS. Pastikan `NEXTAUTH_URL` menggunakan HTTPS.

6. **File Uploads**: Jika ada file upload, gunakan Vercel Blob Storage atau external storage (S3, Cloudinary).

---

## ✅ Checklist Final

Sebelum production, pastikan:

- [ ] Database sudah setup (PostgreSQL/MySQL)
- [ ] Environment variables sudah di-set di Vercel
- [ ] Migration sudah dijalankan
- [ ] Admin account sudah dibuat
- [ ] Build berhasil (`npm run build`)
- [ ] Test semua fitur di preview
- [ ] Webhook URL sudah di-update (jika ada)
- [ ] SMTP sudah dikonfigurasi (jika menggunakan OTP email)
- [ ] Domain sudah di-set (jika menggunakan custom domain)

---

## 🎉 Selesai!

Setelah semua checklist selesai, aplikasi Anda siap untuk production!

Jika ada masalah, cek:
- Vercel Dashboard → Logs
- Vercel Dashboard → Functions
- Database connection logs

