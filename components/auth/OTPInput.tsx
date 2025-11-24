'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  error?: boolean
}

export default function OTPInput({ 
  value, 
  onChange, 
  length = 6, 
  disabled = false,
  error = false 
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  useEffect(() => {
    // Focus first empty input
    const firstEmptyIndex = value.length
    if (firstEmptyIndex < length && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex]?.focus()
    }
  }, [value, length])

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return

    // Only allow numbers
    const numericValue = newValue.replace(/\D/g, '')
    if (numericValue.length > 1) return

    // Update value
    const newOtp = value.split('')
    newOtp[index] = numericValue
    const updatedOtp = newOtp.join('').slice(0, length)
    onChange(updatedOtp)

    // Auto-focus next input
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pastedData.length > 0) {
      onChange(pastedData)
      const nextIndex = Math.min(pastedData.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] || ''
        const isFocused = focusedIndex === index
        const hasValue = !!digit

        return (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <input
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
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              disabled={disabled}
              className={`
                w-12 h-14 sm:w-14 sm:h-16
                text-center text-2xl sm:text-3xl font-bold
                border-2 rounded-xl
                transition-all duration-200
                focus:outline-none
                ${error 
                  ? 'border-red-500 bg-red-50 text-red-700' 
                  : isFocused
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/50 scale-110'
                  : hasValue
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
          </motion.div>
        )
      })}
    </div>
  )
}

