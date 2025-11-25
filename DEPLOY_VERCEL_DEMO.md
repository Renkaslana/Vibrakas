# 🚀 Panduan Deploy Vibra Kas ke Vercel untuk Demo

Panduan lengkap step-by-step untuk deploy aplikasi Vibra Kas ke Vercel dengan database gratis.

---

## ⚠️ PENTING: Database

**SQLite TIDAK bisa digunakan di Vercel!** 

Vercel menggunakan filesystem yang bersifat sementara (ephemeral), jadi file database SQLite akan hilang setiap kali deploy.

**SOLUSI: Gunakan PostgreSQL GRATIS dari Supabase** (Recommended untuk demo)

---

## 📋 Persiapan (5 menit)

### 1. Pastikan Project Sudah di GitHub ✅

Project sudah di GitHub: `https://github.com/Renkaslana/Vibrakas.git`

Jika belum, jalankan:
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### 2. Generate NEXTAUTH_SECRET

Jalankan di terminal:
```bash
# Windows (Git Bash)
openssl rand -base64 32

# Atau gunakan online: https://generate-secret.vercel.app/32
```

**Simpan hasilnya!** (contoh: `aBc123XyZ456...`)

---

## 🗄️ Setup Database GRATIS (10 menit)

### Opsi 1: Supabase (RECOMMENDED - Paling Mudah) ⭐

1. **Daftar di Supabase** (Gratis)
   - Buka: https://supabase.com
   - Klik "Start your project"
   - Login dengan GitHub (paling mudah)

2. **Buat Project Baru**
   - Klik "New Project"
   - **Organization**: Buat baru atau pilih yang ada
   - **Name**: `vibrakas-demo` (atau nama lain)
   - **Database Password**: Buat password kuat (SIMPAN PASSWORD INI!)
   - **Region**: Pilih yang terdekat (Singapore recommended)
   - Klik "Create new project"
   - Tunggu 2-3 menit sampai project siap

3. **Ambil Connection String**
   - Setelah project siap, klik **Settings** (icon gear) di sidebar kiri
   - Klik **Database** di menu
   - Scroll ke bawah, cari **Connection string**
   - Pilih tab **URI**
   - Copy connection string (format: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`)
   - **GANTI `[PASSWORD]` dengan password yang tadi dibuat!**
   - Contoh: `postgresql://postgres.abcdefghijklmnop:MyPassword123@aws-0-singapore.pooler.supabase.com:6543/postgres`

4. **Tambahkan `?sslmode=require` di akhir**
   - Connection string akhir: `postgresql://postgres.xxx:password@host:6543/postgres?sslmode=require`
   - **SIMPAN connection string ini!**

### Opsi 2: Vercel Postgres (Alternatif)

1. Setelah deploy di Vercel (nanti), buka Vercel Dashboard
2. Klik **Storage** → **Create Database** → **Postgres**
3. Copy connection string
4. Tambahkan ke Environment Variables

---

## 🔧 Update Prisma Schema untuk PostgreSQL

**PENTING:** Ubah schema Prisma dari SQLite ke PostgreSQL sebelum deploy!

1. Buka file `prisma/schema.prisma`
2. Ubah bagian `datasource`:

```prisma
datasource db {
  provider = "postgresql"  // Ubah dari "sqlite" ke "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Simpan file

---

## 🚀 Deploy ke Vercel (10 menit)

### Step 1: Import Project

1. Buka https://vercel.com
2. Login dengan GitHub (paling mudah)
3. Klik **"Add New..."** → **"Project"**
4. Cari repository `Renkaslana/Vibrakas`
5. Klik **"Import"**

### Step 2: Configure Project

Di halaman konfigurasi:

- **Framework Preset**: Next.js (otomatis terdeteksi)
- **Root Directory**: `./` (biarkan default)
- **Build Command**: `npm run build` (otomatis)
- **Output Directory**: `.next` (otomatis)
- **Install Command**: `npm install` (otomatis)

**JANGAN klik Deploy dulu!** Kita perlu setup environment variables dulu.

### Step 3: Setup Environment Variables

Klik **"Environment Variables"** di bagian bawah halaman konfigurasi.

Tambahkan satu per satu:

#### 1. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: Connection string dari Supabase (yang tadi disimpan)
- **Environment**: Centang semua (Production, Preview, Development)

#### 2. NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: Secret yang tadi di-generate (contoh: `aBc123XyZ456...`)
- **Environment**: Centang semua

#### 3. NEXTAUTH_URL
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://vibrakas.vercel.app` (atau URL Vercel nanti, bisa diubah setelah deploy)
- **Environment**: Centang semua

#### 4. SMTP (Opsional - untuk OTP Email)

Jika ingin fitur OTP email bekerja:

- **Name**: `SMTP_HOST`
- **Value**: `smtp.gmail.com`
- **Environment**: Centang semua

- **Name**: `SMTP_PORT`
- **Value**: `587`
- **Environment**: Centang semua

- **Name**: `SMTP_USER`
- **Value**: Email Gmail Anda
- **Environment**: Centang semua

- **Name**: `SMTP_PASS`
- **Value**: App Password Gmail (bukan password biasa!)
- **Environment**: Centang semua

- **Name**: `SMTP_FROM`
- **Value**: `Vibra Kas <your-email@gmail.com>`
- **Environment**: Centang semua

**Cara buat App Password Gmail:**
1. Buka https://myaccount.google.com/apppasswords
2. Login dengan Gmail
3. Pilih "Mail" dan "Other (Custom name)"
4. Masukkan nama: "Vibra Kas"
5. Copy password yang di-generate

**Catatan:** Jika tidak setup SMTP, OTP akan tetap muncul di console log untuk development.

#### 5. Payment Gateway (Opsional - untuk fitur payment)

Jika ingin fitur payment bekerja:

- **Name**: `PAYMENT_API_KEY`
- **Value**: API key dari Tripay
- **Environment**: Centang semua

- **Name**: `PAYMENT_SECRET`
- **Value**: Private key dari Tripay
- **Environment**: Centang semua

- **Name**: `PAYMENT_MERCHANT_CODE`
- **Value**: Merchant code dari Tripay
- **Environment**: Centang semua

- **Name**: `PAYMENT_BASE_URL`
- **Value**: `https://tripay.co.id/api`
- **Environment**: Centang semua

### Step 4: Deploy!

Setelah semua environment variables di-set, klik **"Deploy"**

Tunggu 2-5 menit sampai build selesai.

---

## 🗄️ Setup Database Schema (5 menit)

Setelah deploy pertama selesai, kita perlu setup database schema.

### Opsi A: Via Vercel CLI (Recommended)

1. **Install Vercel CLI** (jika belum):
```bash
npm i -g vercel
```

2. **Login ke Vercel**:
```bash
vercel login
```

3. **Link project**:
```bash
cd "C:\my Project\Vibra Kas"
vercel link
```
- Pilih project yang baru di-deploy
- Pilih scope (default)
- Pilih "No" untuk override settings

4. **Pull environment variables**:
```bash
vercel env pull .env.local
```

5. **Update Prisma schema** (jika belum):
   - Buka `prisma/schema.prisma`
   - Ubah `provider = "sqlite"` menjadi `provider = "postgresql"`

6. **Push schema ke database**:
```bash
npx prisma generate
npx prisma db push
```

### Opsi B: Via Supabase Dashboard (Alternatif)

1. Buka Supabase Dashboard → Project Anda
2. Klik **SQL Editor** di sidebar
3. Klik **New Query**
4. Copy isi file `prisma/schema.prisma`
5. Convert ke SQL (atau gunakan Prisma Studio untuk generate SQL)
6. Paste dan jalankan query

**Atau lebih mudah:** Gunakan Prisma Studio:
```bash
npx prisma studio
```
- Buka di browser
- Semua tabel akan otomatis dibuat saat pertama kali akses

### Opsi C: Via Vercel Dashboard (Paling Mudah untuk Demo)

1. Buka Vercel Dashboard → Project Anda
2. Klik tab **Deployments**
3. Klik deployment terbaru
4. Klik **"..."** → **"View Function Logs"**
5. Atau gunakan **Vercel CLI** untuk run command:
```bash
vercel --prod
```

**Cara termudah:** Setelah environment variables di-set, Vercel akan otomatis run `prisma generate` saat build (karena ada di `postinstall` script).

Untuk push schema, jalankan via Vercel CLI atau Supabase Dashboard.

---

## 👤 Buat Admin Pertama

Setelah database schema sudah di-setup, buat admin pertama:

### Opsi A: Register User Pertama (Otomatis jadi Admin)

1. Buka URL Vercel Anda (contoh: `https://vibrakas.vercel.app`)
2. Klik **"Sign Up"** atau **"Daftar"**
3. Register dengan email dan password
4. **User pertama akan otomatis jadi admin!**

### Opsi B: Via Script (Jika perlu)

1. Pull environment variables:
```bash
vercel env pull .env.local
```

2. Update `.env.local` dengan `DATABASE_URL` dari Supabase

3. Jalankan script:
```bash
npm run create-admin your-email@example.com
```

4. Cek file `ADMIN_CREDENTIALS.md` untuk password default

---

## ✅ Verifikasi Deployment

### 1. Test Halaman Utama
- Buka URL Vercel Anda
- Pastikan halaman login muncul

### 2. Test Register
- Klik "Sign Up"
- Isi form register
- Pastikan OTP dikirim (atau muncul di console log jika SMTP belum setup)

### 3. Test Login
- Login dengan akun yang baru dibuat
- Pastikan redirect ke dashboard

### 4. Test Dashboard
- Pastikan saldo muncul
- Test fitur-fitur lainnya

---

## 🐛 Troubleshooting

### Error: "Prisma Client not generated"
**Solusi:**
- Pastikan `postinstall` script ada di `package.json` (sudah ada)
- Redeploy project

### Error: "Database connection failed"
**Solusi:**
- Pastikan `DATABASE_URL` benar
- Pastikan sudah tambahkan `?sslmode=require` di akhir connection string
- Pastikan password di connection string benar
- Cek Supabase Dashboard → Database → apakah project aktif

### Error: "NEXTAUTH_SECRET is missing"
**Solusi:**
- Pastikan sudah tambahkan `NEXTAUTH_SECRET` di Environment Variables
- Pastikan sudah centang semua environment (Production, Preview, Development)
- Redeploy project

### Error: "OTP email not sent"
**Solusi:**
- Jika SMTP belum setup, OTP akan muncul di console log
- Untuk production, setup SMTP dengan benar
- Pastikan App Password Gmail benar (bukan password biasa)

### Database tidak ter-update
**Solusi:**
- Jalankan `npx prisma db push` via Vercel CLI
- Atau via Supabase Dashboard → SQL Editor

### Build Error
**Solusi:**
- Cek Vercel Dashboard → Deployments → Logs
- Pastikan semua dependencies terinstall
- Pastikan Prisma schema sudah diubah ke `postgresql`

---

## 📝 Checklist Final

Sebelum demo, pastikan:

- [ ] Database Supabase sudah dibuat
- [ ] Connection string sudah di-set di Vercel Environment Variables
- [ ] Prisma schema sudah diubah ke `postgresql`
- [ ] `NEXTAUTH_SECRET` sudah di-generate dan di-set
- [ ] `NEXTAUTH_URL` sudah di-set (sesuai domain Vercel)
- [ ] Database schema sudah di-push (`npx prisma db push`)
- [ ] Admin account sudah dibuat (register user pertama)
- [ ] Test semua fitur: Register, Login, Dashboard
- [ ] SMTP sudah di-setup (jika ingin OTP email bekerja)

---

## 🎉 Selesai!

Aplikasi Anda sudah siap untuk demo!

**URL Aplikasi:** `https://vibrakas.vercel.app` (atau URL yang diberikan Vercel)

**Tips untuk Demo:**
- Siapkan beberapa akun test (admin, anggota)
- Test semua fitur sebelum demo
- Siapkan backup plan jika ada error (screenshots, video demo)

---

## 📞 Butuh Bantuan?

Jika ada masalah:
1. Cek **Vercel Dashboard → Logs** untuk error
2. Cek **Supabase Dashboard → Logs** untuk database error
3. Pastikan semua environment variables sudah benar
4. Redeploy project jika perlu

**Selamat demo! 🚀**

