'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Users,
  Settings,
  TrendingUp,
  LogOut,
  Menu,
  X,
  CheckSquare,
  DollarSign,
  FileSearch
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  userRole: string
  userName: string
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'bendahara', 'anggota'] },
  { href: '/payment/create', label: 'Setor Saldo', icon: Wallet, roles: ['admin', 'bendahara', 'anggota'] },
  { href: '/transactions', label: 'Transaksi', icon: FileText, roles: ['admin', 'bendahara', 'anggota'] },
  { href: '/admin/approvals', label: 'Persetujuan Transfer', icon: CheckSquare, roles: ['admin', 'bendahara'] },
  { href: '/reports', label: 'Laporan', icon: TrendingUp, roles: ['admin', 'bendahara', 'anggota'] },
  { href: '/top-spenders', label: 'Top Setoran Anggota', icon: TrendingUp, roles: ['admin', 'bendahara', 'anggota'] },
  { href: '/settings', label: 'Pengaturan', icon: Settings, roles: ['admin', 'bendahara', 'anggota'] },
]

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">Vibra Kas</h1>
            <p className="text-sm text-muted-foreground mt-1">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenu.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

