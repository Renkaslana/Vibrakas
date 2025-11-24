'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ChangeEmailFormProps {
  currentEmail: string
  userName: string
}

export default function ChangeEmailForm({ currentEmail, userName }: ChangeEmailFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [otpCode, setOtpCode] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/change-email/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Gagal mengirim OTP')
        setLoading(false)
        return
      }

      setVerificationId(data.verificationId)
      setSuccess('OTP telah dikirim ke email Anda. Silakan cek inbox email Anda.')
      setStep('verify')
      setResendCooldown(60) // 60 seconds cooldown
      
      // Countdown timer
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      setLoading(false)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const handleVerifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit')
      setLoading(false)
      return
    }

    if (!newEmail || !newEmail.includes('@')) {
      setError('Email baru harus diisi dengan format yang valid')
      setLoading(false)
      return
    }

    if (newEmail === currentEmail) {
      setError('Email baru harus berbeda dengan email saat ini')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/change-email/verify-and-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId,
          otpCode,
          newEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Gagal mengubah email')
        setLoading(false)
        return
      }

      setSuccess('Email berhasil diubah! Halaman akan di-refresh...')
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/change-email/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Gagal mengirim ulang OTP')
        setLoading(false)
        return
      }

      setVerificationId(data.verificationId)
      setSuccess('OTP baru telah dikirim ke email Anda.')
      setOtpCode('')
      setResendCooldown(60)
      
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      setLoading(false)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Verifikasi Email Lama</h3>
          <p className="text-sm text-muted-foreground">
            Kami telah mengirim kode OTP ke <strong>{currentEmail}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleVerifyAndUpdate} className="space-y-4">
          <div>
            <Label htmlFor="otp">Masukkan Kode OTP (6 digit)</Label>
            <Input
              id="otp"
              type="text"
              maxLength={6}
              required
              className="mt-2 text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setOtpCode(value)
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Kode OTP akan kedaluwarsa dalam 10 menit
            </p>
          </div>

          <div>
            <Label htmlFor="new-email">Email Baru</Label>
            <Input
              id="new-email"
              type="email"
              required
              className="mt-2"
              placeholder="email.baru@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Masukkan email baru yang ingin digunakan
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('request')
                setOtpCode('')
                setNewEmail('')
                setError('')
                setSuccess('')
              }}
              disabled={loading}
            >
              ← Kembali
            </Button>
            <Button
              type="submit"
              disabled={loading || otpCode.length !== 6 || !newEmail}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Verifikasi & Ubah Email'
              )}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim ulang OTP'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Ganti Email</h3>
        <p className="text-sm text-muted-foreground">
          Email saat ini: <strong>{currentEmail}</strong>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Untuk mengganti email, Anda perlu memverifikasi email lama terlebih dahulu dengan kode OTP.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleRequestOTP} className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Langkah-langkah:</strong>
          </p>
          <ol className="list-decimal list-inside mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>Klik tombol "Kirim OTP" untuk mengirim kode verifikasi ke email lama</li>
            <li>Cek inbox email <strong>{currentEmail}</strong></li>
            <li>Masukkan kode OTP yang diterima</li>
            <li>Masukkan email baru yang ingin digunakan</li>
            <li>Klik "Verifikasi & Ubah Email"</li>
          </ol>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim OTP...
            </>
          ) : (
            'Kirim OTP ke Email Lama'
          )}
        </Button>
      </form>
    </div>
  )
}

