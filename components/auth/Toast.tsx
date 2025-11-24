'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
      >
        <div
          className={`
            rounded-xl shadow-2xl p-4 flex items-center gap-3
            ${
              type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }
          `}
        >
          {type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <p
            className={`
              flex-1 text-sm font-medium
              ${
                type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }
            `}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            className={`
              p-1 rounded-lg transition-colors
              ${
                type === 'success'
                  ? 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
              }
            `}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

