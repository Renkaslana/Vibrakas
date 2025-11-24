# Panduan Setup Vibra Kas

## Langkah 1: Install Dependencies

```bash
npm install
```

## Langkah 2: Setup Database

### Opsi A: PostgreSQL (Recommended)

1. Install PostgreSQL atau gunakan cloud service (Supabase, Vercel Postgres)
2. Buat database baru:
```sql
CREATE DATABASE vibrakas;
```

### Opsi B: MySQL

1. Install MySQL atau gunakan cloud service
2. Buat database baru:
```sql
CREATE DATABASE vibrakas;
```

## Langkah 3: Konfigurasi Environment Variables

Buat file `.env` di root project (copy dari `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vibrakas?schema=public"

# Authentication (generate dengan: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-secret-key-minimum-32-characters"

# Payment Gateway - Tripay
PAYMENT_API_KEY="your-api-key"
PAYMENT_SECRET="your-private-key"
PAYMENT_MERCHANT_CODE="your-merchant-code"
PAYMENT_BASE_URL="https://tripay.co.id/api"
```

## Langkah 4: Setup Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# Atau gunakan migration (recommended untuk production)
npx prisma migrate dev --name init
```

## Langkah 5: Setup Payment Gateway

### Tripay (Recommended - Gratis)

1. Daftar di https://tripay.co.id
2. Dapatkan API Key, Private Key, dan Merchant Code dari dashboard
3. Masukkan ke `.env`
4. Setup webhook URL di dashboard Tripay:
   - Development: `http://localhost:3000/api/webhook/payment` (gunakan ngrok)
   - Production: `https://yourdomain.com/api/webhook/payment`

### Alternatif: Midtrans

Jika menggunakan Midtrans, ubah implementasi di `lib/payment.ts` sesuai dokumentasi Midtrans.

## Langkah 6: Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Langkah 7: Test Webhook (Development)

Untuk test webhook di local, gunakan ngrok:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Copy URL ngrok (contoh: `https://abc123.ngrok.io`) dan update webhook URL di payment gateway dashboard.

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy di Vercel

1. Buka https://vercel.com
2. Import project dari GitHub
3. Tambahkan Environment Variables:
   - `DATABASE_URL` (dari Vercel Postgres atau Supabase)
   - `NEXTAUTH_SECRET`
   - `PAYMENT_API_KEY`
   - `PAYMENT_SECRET`
   - `PAYMENT_MERCHANT_CODE`
   - `PAYMENT_BASE_URL`
4. Deploy!

### 3. Setup Database di Vercel

**Opsi A: Vercel Postgres**
- Di Vercel dashboard, buka Storage → Create Database → Postgres
- Copy connection string ke `DATABASE_URL`

**Opsi B: Supabase**
- Buat project di https://supabase.com
- Copy connection string ke `DATABASE_URL`

### 4. Run Migration

Setelah deploy, jalankan migration:

```bash
# Via Vercel CLI
vercel env pull .env.local
npx prisma db push

# Atau via Vercel dashboard → Functions → Run command
```

### 5. Update Webhook URL

Setelah deploy, update webhook URL di payment gateway dashboard:
```
https://your-app.vercel.app/api/webhook/payment
```

## Testing Flow

1. **Register**: Buat akun baru di `/auth/register`
2. **Login**: Masuk ke `/auth/login`
3. **Dashboard**: Lihat saldo (default: Rp 0)
4. **Setor Saldo**: Klik "Setor Saldo", input nominal (min Rp 10.000)
5. **Pilih Metode**: QRIS atau Virtual Account
6. **Bayar**: Scan QRIS atau transfer ke VA
7. **Webhook**: Payment gateway akan kirim webhook → saldo otomatis bertambah
8. **Dashboard**: Refresh untuk lihat saldo baru

## Troubleshooting

### Database Connection Error
- Pastikan `DATABASE_URL` benar
- Pastikan database sudah dibuat
- Check firewall/network settings

### Webhook Tidak Terima
- Pastikan webhook URL benar di payment gateway
- Check signature verification di logs
- Pastikan webhook endpoint accessible (tidak blocked)

### Payment Creation Failed
- Check API keys di `.env`
- Check payment gateway status
- Lihat error logs di console/terminal

### Build Error di Vercel
- Pastikan semua dependencies terinstall
- Check `package.json` scripts
- Pastikan Prisma generate di build script

## Security Checklist

- ✅ JWT dengan httpOnly cookies
- ✅ Password hashing (bcrypt)
- ✅ Webhook signature verification
- ✅ Environment variables untuk secrets
- ✅ Server-side validation
- ✅ Idempotent webhook processing

## Catatan Penting

1. **Fee Calculation**: Fee dihitung otomatis (QRIS: 0.5%, VA: 0.3%)
2. **Balance Update**: Hanya `amount` yang ditambahkan (fee tidak ditambahkan)
3. **Webhook Security**: Selalu verifikasi signature
4. **Idempotency**: Webhook handler sudah idempotent

