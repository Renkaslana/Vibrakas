'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import styles from '../template-auth.module.css'
import 'boxicons/css/boxicons.min.css'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === 'true'
  
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form states
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')

  // Handle label animation (sama seperti script.js)
  useEffect(() => {
    const inputBoxes = document.querySelectorAll(`.${styles.inputBox}`)
    
    inputBoxes.forEach((inputBox) => {
      const input = inputBox.querySelector('input') as HTMLInputElement
      if (!input) return

      // Check on mount if input has value
      if (input.value.trim() !== '') {
        inputBox.classList.add(styles.hasValue)
      }

      // Handle input events
      const handleInput = () => {
        if (input.value.trim() !== '') {
          inputBox.classList.add(styles.hasValue)
        } else {
          inputBox.classList.remove(styles.hasValue)
        }
      }

      // Handle focus events
      const handleFocus = () => {
        inputBox.classList.add(styles.hasValue)
      }

      // Handle blur events
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
  }, [isRegister]) // Re-run when form changes

  // Show success message if registered
  useEffect(() => {
    if (registered) {
      setSuccess('Registrasi berhasil! Silakan login dengan akun Anda.')
      setTimeout(() => setSuccess(''), 5000)
    }
  }, [registered])

  // Handle login form submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah')
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  // Handle register form submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!registerName.trim()) {
      setError('Nama lengkap wajib diisi')
      setLoading(false)
      return
    }

    if (!registerEmail.trim()) {
      setError('Email wajib diisi')
      setLoading(false)
      return
    }

    if (registerPassword.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    try {
      // Store password in sessionStorage for resend OTP
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('register_password', registerPassword)
      }

      const res = await fetch('/api/auth/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.message || 'Gagal mengirim OTP')
        setLoading(false)
        return
      }

      // Success - redirect to register verify page with data
      router.push(`/auth/register/verify?email=${encodeURIComponent(registerEmail)}&name=${encodeURIComponent(registerName)}&verificationId=${result.verificationId}`)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

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

        <div className={`${styles.logregBox} ${isRegister ? styles.active : ''}`}>
          {/* Login Form */}
          <div className={`${styles.formBox} ${styles.login}`}>
            <form onSubmit={handleLoginSubmit}>
              <h2>Sign In</h2>

              {error && !isRegister && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {success && !isRegister && (
                <div className={styles.successMessage}>
                  {success}
                </div>
              )}

              <div className={styles.inputBox}>
                <span className={styles.icon}>
                  <i className='bx bxs-envelope'></i>
                </span>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
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
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <label>Password</label>
              </div>

              <div className={styles.rememberForgot}>
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <a href="/auth/forgot-password">Forgot Password?</a>
              </div>

              <button type="submit" className={styles.btn} disabled={loading && !isRegister}>
                {loading && !isRegister ? 'Loading...' : 'Sign In'}
              </button>

              <div className={styles.loginRegister}>
                <p>
                  Don&apos;t have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsRegister(true)
                      setError('')
                      setSuccess('')
                    }}
                    className={styles.registerLink}
                  >
                    Sign Up
                  </a>
                </p>
              </div>
            </form>
          </div>

          {/* Register Form */}
          <div className={`${styles.formBox} ${styles.register}`}>
            <form onSubmit={handleRegisterSubmit}>
              <h2>Sign Up</h2>

              {error && isRegister && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {success && isRegister && (
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
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
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
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
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
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
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
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                />
                <label>Konfirmasi Password</label>
              </div>

              <div className={styles.rememberForgot}>
                <label>
                  <input type="checkbox" required /> I agree to the terms & conditions
                </label>
              </div>

              <button type="submit" className={styles.btn} disabled={loading && isRegister}>
                {loading && isRegister ? 'Loading...' : 'Sign Up'}
              </button>

              <div className={styles.loginRegister}>
                <p>
                  Already have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsRegister(false)
                      setError('')
                      setSuccess('')
                    }}
                    className={styles.loginLink}
                  >
                    Sign In
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
