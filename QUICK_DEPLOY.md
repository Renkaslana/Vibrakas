# ⚡ Quick Deploy Guide - Vibra Kas ke Vercel

Panduan cepat deploy untuk demo (15 menit).

---

## 🎯 Langkah Cepat

### 1. Generate NEXTAUTH_SECRET (1 menit)
```bash
npm run generate-secret
```
Copy hasilnya!

### 2. Setup Database Supabase (5 menit)

1. Daftar: https://supabase.com (gratis)
2. Buat project baru
3. Settings → Database → Connection string (URI)
4. Copy connection string, ganti `[PASSWORD]` dengan password project
5. Tambahkan `?sslmode=require` di akhir

**Contoh:**
```
postgresql://postgres.xxx:YourPassword123@aws-0-singapore.pooler.supabase.com:6543/postgres?sslmode=require
```

### 3. Update Prisma Schema (1 menit)

Buka `prisma/schema.prisma`, ubah:
```prisma
datasource db {
  provider = "postgresql"  // Ubah dari "sqlite"
  url      = env("DATABASE_URL")
}
```

### 4. Commit & Push (1 menit)
```bash
git add .
git commit -m "Update schema for PostgreSQL deployment"
git push
```

### 5. Deploy di Vercel (5 menit)

1. Buka https://vercel.com → Login dengan GitHub
2. Add New Project → Import `Renkaslana/Vibrakas`
3. **Environment Variables** (tambahkan):
   - `DATABASE_URL` = connection string dari Supabase
   - `NEXTAUTH_SECRET` = secret yang di-generate tadi
   - `NEXTAUTH_URL` = `https://vibrakas.vercel.app` (atau URL Vercel nanti)
4. Klik **Deploy**

### 6. Setup Database Schema (2 menit)

Setelah deploy selesai:

**Via Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npx prisma db push
```

**Atau via Supabase Dashboard:**
- SQL Editor → New Query
- Jalankan migration (atau gunakan Prisma Studio)

### 7. Buat Admin (1 menit)

1. Buka URL Vercel Anda
2. Register user pertama → **Otomatis jadi admin!**
3. Atau jalankan: `npm run create-admin your-email@example.com`

---

## ✅ Selesai!

Aplikasi siap untuk demo di: `https://vibrakas.vercel.app`

---

## 📚 Panduan Lengkap

Lihat `DEPLOY_VERCEL_DEMO.md` untuk panduan detail dengan troubleshooting.

---

## 🆘 Troubleshooting Cepat

**Error database?**
- Pastikan connection string benar
- Pastikan sudah tambahkan `?sslmode=require`

**Error build?**
- Pastikan Prisma schema sudah diubah ke `postgresql`
- Cek Vercel Dashboard → Logs

**OTP tidak terkirim?**
- Setup SMTP di Environment Variables (lihat `DEPLOY_VERCEL_DEMO.md`)
- Atau cek console log untuk OTP (development mode)

