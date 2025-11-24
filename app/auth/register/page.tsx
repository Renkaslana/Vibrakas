'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../template-auth.module.css'
import 'boxicons/css/boxicons.min.css'

// OTP Input Component untuk Template
function OTPInputTemplate({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const firstEmptyIndex = value.length
    if (firstEmptyIndex < 6 && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex]?.focus()
    }
  }, [value])

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return
    const numericValue = newValue.replace(/\D/g, '')
    if (numericValue.length > 1) return

    const newOtp = value.split('')
    newOtp[index] = numericValue
    const updatedOtp = newOtp.join('').slice(0, 6)
    onChange(updatedOtp)

    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newOtp = value.split('')
      newOtp[index - 1] = ''
      onChange(newOtp.join(''))
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length > 0) {
      onChange(pastedData)
      const nextIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '20px',
      gap: '10px'
    }}>
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = value[index] || ''
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            style={{
              width: '45px',
              height: '55px',
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: '600',
              border: '2px solid #e4e4e4',
              borderRadius: '8px',
              background: 'transparent',
              color: '#e4e4e4',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#e4e4e4'
              e.target.style.background = 'rgba(228, 228, 228, 0.1)'
              e.target.style.boxShadow = '0 0 10px rgba(228, 228, 228, 0.3)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e4e4e4'
              e.target.style.background = 'transparent'
              e.target.style.boxShadow = 'none'
            }}
          />
        )
      })}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [otpCode, setOtpCode] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Handle label animation
  useEffect(() => {
    const inputBoxes = document.querySelectorAll(`.${styles.inputBox}`)
    
    inputBoxes.forEach((inputBox) => {
      const input = inputBox.querySelector('input') as HTMLInputElement
      if (!input) return

      if (input.value.trim() !== '') {
        inputBox.classList.add(styles.hasValue)
      }

      const handleInput = () => {
        if (input.value.trim() !== '') {
          inputBox.classList.add(styles.hasValue)
        } else {
          inputBox.classList.remove(styles.hasValue)
        }
      }

      const handleFocus = () => {
        inputBox.classList.add(styles.hasValue)
      }

      const handleBlur = () => {
        if (input.value.trim() === '') {
          inputBox.classList.remove(styles.hasValue)
        }
      }

      input.addEventListener('input', handleInput)
      input.addEventListener('focus', handleFocus)
      input.addEventListener('blur', handleBlur)

      return () => {
        input.removeEventListener('input', handleInput)
        input.removeEventListener('focus', handleFocus)
        input.removeEventListener('blur', handleBlur)
      }
    })
  }, [step])

  // Countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Handle register form submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi')
      setLoading(false)
      return
    }

    if (!email.trim()) {
      setError('Email wajib diisi')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.message || 'Gagal mengirim OTP')
        setLoading(false)
        return
      }

      setVerificationId(result.verificationId)
      setSuccess('OTP telah dikirim ke email Anda')
      setStep('verify')
      setResendCooldown(60)
      setLoading(false)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit')
      setLoading(false)
      return
    }

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
        return
      }

      // Success - redirect to login
      router.push('/auth/login?registered=true')
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.message || 'Gagal mengirim ulang OTP')
        setLoading(false)
        return
      }

      setVerificationId(result.verificationId)
      setSuccess('OTP baru telah dikirim ke email Anda')
      setOtpCode('')
      setResendCooldown(60)
      setLoading(false)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  // Verify Step
  if (step === 'verify') {
    return (
      <div style={{ 
        background: '#020410', 
        minHeight: '100vh', 
        position: 'relative',
        fontFamily: "'Poppins', sans-serif"
      }}>
        <div className={styles.background}></div>
        
        <div className={styles.container}>
          <div className={styles.content}>
            <h2 className={styles.logo}>
              <i className='bx bxs-coin-stack'></i> VibraKas
            </h2>

            <div className={styles.textSci}>
              <h2>Verifikasi Email<br /><span>Masukkan Kode OTP</span></h2>
              <p>Kami telah mengirim kode OTP ke email Anda.</p>
            </div>
          </div>

          <div className={styles.logregBox}>
            <div className={`${styles.formBox} ${styles.register}`}>
              <form onSubmit={handleVerifyOTP}>
                <h2>Verifikasi OTP</h2>

                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}

                {success && (
                  <div className={styles.successMessage}>
                    {success}
                  </div>
                )}

                <div style={{ margin: '30px 0', textAlign: 'center' }}>
                  <p style={{ color: '#e4e4e4', marginBottom: '20px', fontSize: '14px' }}>
                    Masukkan kode OTP yang dikirim ke:
                  </p>
                  <p style={{ color: '#e4e4e4', fontWeight: '600', marginBottom: '30px' }}>
                    {email}
                  </p>
                  
                  <OTPInputTemplate
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={loading}
                  />

                  <p style={{ color: '#e4e4e4', fontSize: '12px', marginTop: '20px' }}>
                    Kode OTP akan kedaluwarsa dalam 10 menit
                  </p>
                </div>

                <button type="submit" className={styles.btn} disabled={loading || otpCode.length !== 6}>
                  {loading ? 'Loading...' : 'Verifikasi & Daftar'}
                </button>

                <div className={styles.loginRegister}>
                  <p>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setStep('form')
                        setOtpCode('')
                        setError('')
                        setSuccess('')
                      }}
                      style={{ color: '#e4e4e4', textDecoration: 'none' }}
                    >
                      ← Kembali
                    </a>
                    {' | '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handleResendOTP()
                      }}
                      style={{ 
                        color: '#e4e4e4', 
                        textDecoration: 'none',
                        opacity: resendCooldown > 0 ? 0.5 : 1,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim ulang OTP'}
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Register Form
  return (
    <div style={{ 
      background: '#020410', 
      minHeight: '100vh', 
      position: 'relative',
      fontFamily: "'Poppins', sans-serif"
    }}>
      <div className={styles.background}></div>
      
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.logo}>
            <i className='bx bxs-coin-stack'></i> VibraKas
          </h2>

          <div className={styles.textSci}>
            <h2>Selamat Datang!<br /><span>di VibraKas.</span></h2>
            <p>VibraKas Platform pengelolaan uang kas Vibra.</p>
          </div>
        </div>

        <div className={styles.logregBox}>
          {/* Register Form */}
          <div className={`${styles.formBox} ${styles.register}`}>
            <form onSubmit={handleRegisterSubmit}>
              <h2>Sign Up</h2>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {success && (
                <div className={styles.successMessage}>
                  {success}
                </div>
              )}

              <div className={styles.inputBox}>
                <span className={styles.icon}>
                  <i className='bx bxs-user'></i>
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label>Nama Lengkap</label>
              </div>

              <div className={styles.inputBox}>
                <span className={styles.icon}>
                  <i className='bx bxs-envelope'></i>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label>Email</label>
              </div>

              <div className={styles.inputBox}>
                <span className={styles.icon}>
                  <i className='bx bxs-lock'></i>
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label>Password</label>
              </div>

              <div className={styles.inputBox}>
                <span className={styles.icon}>
                  <i className='bx bxs-lock'></i>
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <label>Konfirmasi Password</label>
              </div>

              <div className={styles.rememberForgot}>
                <label>
                  <input type="checkbox" required /> I agree to the terms & conditions
                </label>
              </div>

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? 'Loading...' : 'Sign Up'}
              </button>

              <div className={styles.loginRegister}>
                <p>
                  Already have an account?{' '}
                  <Link href="/auth/login" className={styles.loginLink}>
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
