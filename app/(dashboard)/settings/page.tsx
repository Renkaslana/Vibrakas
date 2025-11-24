import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate } from "@/lib/utils"
import ResetDataForm from "@/components/settings/ResetDataForm"
import ChangeEmailForm from "@/components/settings/ChangeEmailForm"
import TreasurerForm from "@/components/admin/TreasurerForm"
import AdjustmentClient from "@/components/admin/AdjustmentClient"
import AuditLogClient from "@/components/admin/AuditLogClient"
import UsersTable from "@/components/admin/UsersTable"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const userId = (session.user as any).id
  const userRole = session.user.role || "anggota"

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      balance: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect("/auth/login")
  }

  // Get user statistics
  const totalTransactions = await prisma.transaction.count({
    where: { userId },
  })

  const totalIncome = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "in",
      status: "success",
    },
    _sum: {
      amount: true,
    },
  })

  const totalExpense = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "out",
      status: "success",
    },
    _sum: {
      amount: true,
    },
  })

  // Get data for admin/bendahara tabs
  let treasurerAccounts: any[] = []
  let allUsers: any[] = []
  let auditLogs: any[] = []

  if (userRole === "admin" || userRole === "bendahara") {
    // Get treasurer accounts
    const allAccounts = await prisma.treasurerAccount.findMany({
      orderBy: { createdAt: 'asc' },
    })
    treasurerAccounts = allAccounts.sort((a: any, b: any) => {
      const orderA = (a as any).order ?? 0
      const orderB = (b as any).order ?? 0
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    // Get all users for adjustment
    allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        role: true,
      },
      orderBy: { name: "asc" },
    })

    // Get audit logs
    const auditLogsRaw = await prisma.auditLog.findMany({
      orderBy: { performedAt: "desc" },
      take: 100,
    })
    auditLogs = await Promise.all(
      auditLogsRaw.map(async (log) => {
        const performer = await prisma.user.findUnique({
          where: { id: log.performedBy },
          select: { name: true, email: true },
        })
        return {
          ...log,
          performer: performer || { name: "Unknown", email: "unknown" },
        }
      })
    )
  }

  // Get users for management (admin/bendahara only)
  let usersForManagement: any[] = []
  if (userRole === "admin" || userRole === "bendahara") {
    usersForManagement = await prisma.user.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Determine available tabs based on role
  const isAdmin = userRole === "admin"
  const isAdminOrBendahara = userRole === "admin" || userRole === "bendahara"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun dan pengaturan sistem
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full flex flex-wrap gap-2 h-auto p-2">
          <TabsTrigger value="account" className="flex-1 min-w-[120px]">Informasi Akun</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 min-w-[120px]">Keamanan</TabsTrigger>
          {isAdminOrBendahara && (
            <>
              <TabsTrigger value="treasurer" className="flex-1 min-w-[120px]">Rekening</TabsTrigger>
              <TabsTrigger value="adjustment" className="flex-1 min-w-[120px]">Koreksi Saldo</TabsTrigger>
              <TabsTrigger value="audit" className="flex-1 min-w-[120px]">Audit Log</TabsTrigger>
              <TabsTrigger value="users" className="flex-1 min-w-[120px]">Manajemen User</TabsTrigger>
            </>
          )}
          {isAdmin && (
            <TabsTrigger value="reset" className="flex-1 min-w-[120px]">Hapus Data</TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Informasi Akun */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>
                Informasi profil dan statistik akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nama Lengkap</Label>
                  <p className="text-sm">{user.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm capitalize">{user.role}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Saldo Saat Ini</Label>
                  <p className="text-sm font-bold">{formatCurrency(user.balance)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tanggal Registrasi</Label>
                  <p className="text-sm">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Statistik Akun</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Transaksi</p>
                    <p className="text-2xl font-bold">{totalTransactions}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Pemasukan</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalIncome._sum.amount || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(totalExpense._sum.amount || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Keamanan */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Keamanan</CardTitle>
              <CardDescription>
                Kelola password dan keamanan akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ganti Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Fitur ganti password akan segera hadir.
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <ChangeEmailForm currentEmail={user.email} userName={user.name} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Rekening Bendahara (Admin/Bendahara Only) */}
        {isAdminOrBendahara && (
          <TabsContent value="treasurer">
            <Card>
              <CardHeader>
                <CardTitle>Rekening Bendahara</CardTitle>
                <CardDescription>
                  Kelola informasi rekening tujuan untuk transfer manual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TreasurerForm initialData={treasurerAccounts} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Koreksi Saldo (Admin/Bendahara Only) */}
        {isAdminOrBendahara && (
          <TabsContent value="adjustment">
            <AdjustmentClient users={allUsers} />
          </TabsContent>
        )}

        {/* Tab: Audit Log (Admin/Bendahara Only) */}
        {isAdminOrBendahara && (
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  History semua perubahan dan aktivitas sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogClient auditLogs={auditLogs} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Manajemen User (Admin/Bendahara Only) */}
        {isAdminOrBendahara && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen User</CardTitle>
                <CardDescription>
                  Kelola data anggota dan pengguna sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTable users={usersForManagement} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Hapus Data (Admin Only) */}
        {isAdmin && (
          <TabsContent value="reset">
            <ResetDataForm />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

