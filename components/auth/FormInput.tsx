'use client'

import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  icon?: LucideIcon
  error?: string
  showPasswordToggle?: boolean
  onTogglePassword?: () => void
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, error, showPasswordToggle, onTogglePassword, className, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    
    const handleToggle = () => {
      const newState = !showPassword
      setShowPassword(newState)
      if (onTogglePassword) {
        onTogglePassword()
      }
    }
    
    const inputType = type === 'password' && showPasswordToggle
      ? (showPassword ? 'text' : 'password')
      : type
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border transition-all duration-200',
              'bg-white dark:bg-gray-800',
              'border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'focus:border-transparent',
              Icon ? 'pl-12' : 'pl-4',
              showPasswordToggle ? 'pr-12' : 'pr-4',
              error
                ? 'border-red-300 dark:border-red-700 focus:ring-red-500 animate-[shake_0.3s_ease-in-out]'
                : 'focus:ring-blue-500 dark:focus:ring-purple-500 focus:shadow-lg focus:shadow-blue-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            type={inputType}
            {...props}
          />
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={handleToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {inputType === 'password' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"
          >
            <span>•</span>
            <span>{error}</span>
          </motion.p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput

