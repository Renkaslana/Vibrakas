'use client'

import { motion } from 'framer-motion'
import { Wallet, Shield, TrendingUp, Sparkles } from 'lucide-react'
import VibraLogo from './VibraLogo'

export default function MobileBranding() {
  const features = [
    { icon: Shield, text: 'Aman & Terpercaya' },
    { icon: Wallet, text: 'Kelola Uang Kas' },
    { icon: TrendingUp, text: 'Laporan Lengkap' },
  ]

  return (
    <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-b-3xl pb-8 pt-12 px-6 mb-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles - Mobile optimized */}
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-10 -right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-48 h-48 bg-pink-500/15 rounded-full blur-2xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="flex flex-col items-center mb-8"
        >
          <VibraLogo size="lg" />
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">
            Vibra Kas
          </h1>
          <p className="text-blue-100 text-sm text-center">
            Sistem Pengelolaan Uang Kas
          </p>
        </motion.div>

        {/* Features - Horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-md rounded-2xl min-w-[100px]"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white text-center font-medium">
                  {feature.text}
                </span>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-center gap-2 text-blue-100 text-xs mt-6"
        >
          <Sparkles className="w-3 h-3" />
          <span>Dibuat dengan teknologi modern</span>
        </motion.div>
      </div>
    </div>
  )
}

