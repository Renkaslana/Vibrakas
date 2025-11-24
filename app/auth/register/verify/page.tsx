'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './verify.module.css'

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const verificationId = searchParams.get('verificationId') || ''
  const email = searchParams.get('email') || ''

  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const otpWrapperRef = useRef<HTMLDivElement>(null)

  // Countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 300)
    }
  }, [])

  // Haptic feedback function
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10) // 10ms vibration
    }
  }

  // Shake animation
  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // Handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    if (loading) return

    // Only allow numbers
    const numericValue = value.replace(/\D/g, '')
    if (numericValue.length > 1) return

    // Update OTP code
    const newOtp = otpCode.split('')
    newOtp[index] = numericValue
    const updatedOtp = newOtp.join('').slice(0, 6)
    setOtpCode(updatedOtp)
    setError('')

    // Haptic feedback
    triggerHaptic()

    // Auto-focus next input
    if (numericValue && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus()
      }, 10)
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newOtp = otpCode.split('')
      newOtp[index - 1] = ''
      setOtpCode(newOtp.join(''))
      triggerHaptic()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length > 0) {
      setOtpCode(pastedData)
      setError('')
      triggerHaptic()
      const nextIndex = Math.min(pastedData.length, 5)
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus()
      }, 10)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit')
      triggerShake()
      return
    }

    if (!verificationId) {
      setError('Verification ID tidak ditemukan. Silakan daftar ulang.')
      triggerShake()
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId,
          otpCode,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.message || 'Verifikasi gagal')
        setLoading(false)
        triggerShake()
        return
      }

      // Clear stored password
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('register_password')
      }

      // Success - redirect to login
      router.push('/auth/login?registered=true')
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
      triggerShake()
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !email) return

    setLoading(true)
    setError('')

    try {
      // Get password from sessionStorage
      const storedPassword = typeof window !== 'undefined' 
        ? sessionStorage.getItem('register_password') 
        : null

      if (!storedPassword) {
        setError('Tidak dapat mengirim ulang OTP. Silakan daftar ulang.')
        setLoading(false)
        return
      }

      // Get name from URL or sessionStorage
      const name = searchParams.get('name') || ''

      const res = await fetch('/api/auth/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: storedPassword,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.message || 'Gagal mengirim ulang OTP')
        setLoading(false)
        return
      }

      // Update verification ID
      router.replace(
        `/auth/register/verify?verificationId=${result.verificationId}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
      )
      setOtpCode('')
      setResendCooldown(30) // 30 seconds cooldown
      setLoading(false)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  // Redirect if missing params
  if (!verificationId || !email) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.background}></div>
        <div className={styles.errorContainer}>
          <h2>Data tidak lengkap</h2>
          <p>Silakan daftar ulang</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className={styles.btn}
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.background}></div>
      
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h1 className={styles.title}>Verifikasi OTP</h1>
          <p className={styles.subtitle}>
            Masukkan 6 digit kode yang telah dikirim ke email kamu
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className={styles.form}>
          <div 
            ref={otpWrapperRef}
            className={`${styles.otpWrapper} ${shake ? styles.shake : ''}`}
          >
            {Array.from({ length: 6 }).map((_, index) => {
              const digit = otpCode[index] || ''
              const hasError = error && !digit
              
              return (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className={`${styles.otpInput} ${hasError ? styles.otpInputError : ''} ${digit ? styles.otpInputFilled : ''}`}
                  aria-label={`OTP digit ${index + 1}`}
                />
              )
            })}
          </div>

          <button 
            type="submit" 
            className={styles.btn}
            disabled={loading || otpCode.length !== 6}
          >
            {loading ? 'Memverifikasi...' : 'Konfirmasi'}
          </button>

          <div className={styles.resendContainer}>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              className={styles.resendLink}
            >
              {resendCooldown > 0 
                ? `Kirim ulang kode OTP (${resendCooldown}s)` 
                : 'Kirim ulang kode OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
