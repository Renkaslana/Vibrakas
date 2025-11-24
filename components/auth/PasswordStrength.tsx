'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface PasswordStrengthProps {
  password: string
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' }

    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 2) return { level: 1, label: 'Lemah', color: 'bg-red-500' }
    if (score <= 4) return { level: 2, label: 'Sedang', color: 'bg-yellow-500' }
    return { level: 3, label: 'Kuat', color: 'bg-green-500' }
  }, [password])

  if (!password) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">Kekuatan Password</span>
        <span className={`font-medium ${
          strength.level === 1 ? 'text-red-500' :
          strength.level === 2 ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(strength.level / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full ${strength.color} rounded-full`}
        />
      </div>
    </div>
  )
}



