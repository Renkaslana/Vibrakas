'use client'

import { Shield } from 'lucide-react'

export default function SecurityBadge() {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Shield className="w-4 h-4 text-purple-500" />
        <span>Data Anda dienkripsi dan aman 💜</span>
      </div>
    </div>
  )
}



