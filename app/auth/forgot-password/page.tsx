'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import FormInput from '@/components/auth/FormInput'
import GradientButton from '@/components/auth/GradientButton'
import Toast from '@/components/auth/Toast'
import VibraLogo from '@/components/auth/VibraLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setToast(null)

    // TODO: Implement forgot password API
    setTimeout(() => {
      setToast({
        message: 'Fitur ini sedang dalam pengembangan',
        type: 'error',
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12 safe-area-inset">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <VibraLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
            Vibra Kas
          </h1>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              Lupa Password?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              id="email"
              type="email"
              label="Email"
              icon={Mail}
              placeholder="nama@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <GradientButton loading={loading} icon={Mail}>
              Kirim Link Reset
            </GradientButton>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

