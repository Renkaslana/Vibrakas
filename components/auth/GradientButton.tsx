'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GradientButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  loading?: boolean
  icon?: LucideIcon
  children: React.ReactNode
}

export default function GradientButton({
  loading = false,
  icon: Icon,
  children,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'w-full py-4 px-6 rounded-2xl font-semibold',
        'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500',
        'text-white shadow-lg',
        'hover:shadow-xl hover:shadow-purple-500/30',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'relative overflow-hidden group',
        className
      )}
      {...props}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            {Icon && <Icon className="w-5 h-5" />}
            {children}
          </>
        )}
      </span>
    </motion.button>
  )
}

