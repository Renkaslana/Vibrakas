'use client'

import { motion } from 'framer-motion'
import { Shield, Wallet, TrendingUp, Sparkles } from 'lucide-react'
import VibraLogo from './VibraLogo'

export default function DesktopHero() {
  const features = [
    { icon: Shield, text: 'Aman & Terpercaya', delay: 0.2 },
    { icon: Wallet, text: 'Kelola Uang Kas', delay: 0.3 },
    { icon: TrendingUp, text: 'Laporan Lengkap', delay: 0.4 },
  ]

  return (
    <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center p-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <VibraLogo size="lg" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Vibra Kas
              </h1>
              <p className="text-blue-100 text-sm">Sistem Pengelolaan Uang Kas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <div>
            <h2 className="text-5xl font-bold mb-4 leading-tight">
              Kelola Uang Kas
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                Lebih Mudah
              </span>
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Platform digital untuk mengelola keuangan kas organisasi dengan mudah, aman, dan transparan.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: feature.delay }}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-lg">{feature.text}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 flex items-center gap-2 text-blue-100 text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Dibuat dengan teknologi modern</span>
        </motion.div>
      </div>
    </div>
  )
}



