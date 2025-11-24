# Vibra Kas - Sistem Top Up Saldo

Aplikasi web full-stack untuk top up saldo menggunakan QRIS dan Virtual Account dengan integrasi payment gateway.

## Teknologi

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM**
- **PostgreSQL** (atau MySQL)
- **JWT Authentication**
- **Payment Gateway** (Tripay/Midtrans/Xendit)

## Fitur

- ✅ Register & Login dengan JWT
- ✅ Dashboard user dengan saldo
- ✅ Setor saldo dengan QRIS atau Virtual Account
- ✅ Webhook untuk update otomatis status pembayaran
- ✅ Auto-refresh status pembayaran
- ✅ Verifikasi signature webhook (aman)
- ✅ Idempotent webhook processing

## Instalasi

### 1. Clone dan Install Dependencies

```bash
npm install
```

### 2. Setup Database

Buat file `.env` di root project:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"  # SQLite untuk development
# Atau untuk production:
# DATABASE_URL="postgresql://user:password@localhost:5432/vibrakas?schema=public"

# Authentication
NEXTAUTH_SECRET="your-random-secret-key-here-min-32-chars"

# Payment Gateway (Tripay)
PAYMENT_API_KEY="your-tripay-api-key"
PAYMENT_SECRET="your-tripay-private-key"
PAYMENT_MERCHANT_CODE="your-merchant-code"
PAYMENT_BASE_URL="https://tripay.co.id/api"

# Email SMTP (untuk OTP verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Vibra Kas <your-email@gmail.com>"
```

### 3. Setup Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# Atau gunakan migrate
npx prisma migrate dev --name init
```

### 4. Buat Admin Pertama

```bash
# Stop dev server terlebih dahulu (Ctrl + C)

# Buat admin dengan email default
npm run create-admin

# Atau dengan email custom
npm run create-admin your-email@example.com
```

**Informasi Login Admin:**
- Lihat file `ADMIN_CREDENTIALS.md` untuk detail kredensial admin
- **PENTING**: Ganti password setelah login pertama kali!

### 5. Setup Email (Opsional, untuk OTP)

Lihat `SETUP_EMAIL.md` untuk panduan lengkap setup email SMTP.

### 6. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Struktur Folder

```
/app
  /auth          # Halaman login & register
  /dashboard     # Dashboard user
  /payment       # Halaman pembayaran
/api
  /auth          # API authentication
  /payment       # API pembayaran
  /webhook       # Webhook endpoint
/prisma
  schema.prisma  # Database schema
/lib
  db.ts          # Prisma client
  auth.ts        # JWT utilities
  payment.ts     # Payment gateway integration
  verifySignature.ts # Webhook verification
```

## Konfigurasi Payment Gateway

### Tripay

1. Daftar di [Tripay](https://tripay.co.id)
2. Dapatkan API Key, Private Key, dan Merchant Code
3. Setup webhook URL di dashboard Tripay: `https://yourdomain.com/api/webhook/payment`
4. Masukkan credentials ke `.env`

### Midtrans (Alternatif)

Jika menggunakan Midtrans, ubah file `lib/payment.ts` sesuai dokumentasi Midtrans.

### Xendit (Alternatif)

Jika menggunakan Xendit, ubah file `lib/payment.ts` sesuai dokumentasi Xendit.

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

1. Import project dari GitHub di [Vercel Dashboard](https://vercel.com)
2. Tambahkan Environment Variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `PAYMENT_API_KEY`
   - `PAYMENT_SECRET`
   - `PAYMENT_MERCHANT_CODE`
   - `PAYMENT_BASE_URL`
3. Deploy!

### 3. Setup Database (Vercel Postgres / Supabase)

- Gunakan Vercel Postgres atau Supabase untuk database
- Update `DATABASE_URL` di Vercel Environment Variables
- Jalankan migration: `npx prisma db push` (atau via Vercel CLI)

### 4. Update Webhook URL

Setelah deploy, update webhook URL di dashboard payment gateway:
```
https://your-app.vercel.app/api/webhook/payment
```

## Testing

### Test Flow Pembayaran

1. Register/Login
2. Klik "Setor Saldo"
3. Input nominal (min Rp 10.000)
4. Pilih metode (QRIS/VA)
5. Scan QRIS atau transfer ke VA
6. Webhook akan otomatis update status
7. Saldo bertambah di dashboard

### Test Webhook (Development)

Gunakan ngrok untuk test webhook di local:

```bash
npx ngrok http 3000
```

Update webhook URL di payment gateway dashboard ke ngrok URL.

## Security Notes

- ✅ Webhook signature verification (wajib)
- ✅ JWT dengan httpOnly cookies
- ✅ Password hashing dengan bcrypt
- ✅ Environment variables untuk secrets
- ✅ Idempotent webhook processing
- ✅ Server-side validation

## Catatan Penting

1. **Fee Calculation**: Fee dihitung otomatis (QRIS: 0.5%, VA: 0.3%)
2. **Balance Update**: Hanya `amount` yang ditambahkan ke balance (fee tidak ditambahkan)
3. **Webhook Security**: Selalu verifikasi signature sebelum proses
4. **Idempotency**: Webhook handler sudah idempotent (tidak double update)

## Troubleshooting

### Database Connection Error

Pastikan `DATABASE_URL` benar dan database sudah dibuat.

### Webhook Tidak Terima

- Pastikan webhook URL benar di payment gateway dashboard
- Check signature verification
- Check logs di Vercel dashboard

### Payment Creation Failed

- Pastikan API keys benar
- Check payment gateway status
- Lihat error logs di console

## License

MIT

