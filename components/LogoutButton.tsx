'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-700 hover:text-gray-900 text-sm font-medium"
    >
      Keluar
    </button>
  )
}

