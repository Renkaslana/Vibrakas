'use client'

import { motion } from 'framer-motion'

interface VibraLogoProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

export default function VibraLogo({ size = 'md', animated = true, className = '' }: VibraLogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const LogoContent = (
    <div className={`${sizes[size]} ${className} relative`}>
      {/* V Shape dengan gradient */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vibraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="vibraGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        
        {/* V Shape - Left */}
        <path
          d="M 20 20 L 20 60 L 35 80 L 50 60 L 50 20 Z"
          fill="url(#vibraGradient)"
          className="drop-shadow-lg"
        />
        
        {/* V Shape - Right */}
        <path
          d="M 50 20 L 50 60 L 65 80 L 80 60 L 80 20 Z"
          fill="url(#vibraGradient2)"
          className="drop-shadow-lg"
        />
        
        {/* Accent circle */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="white"
          opacity="0.3"
        />
      </svg>
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="inline-block"
      >
        {LogoContent}
      </motion.div>
    )
  }

  return LogoContent
}

