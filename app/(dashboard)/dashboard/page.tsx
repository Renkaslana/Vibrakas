import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Wallet, TrendingUp, TrendingDown, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DashboardCharts from "@/components/dashboard/DashboardCharts"
import RecentTransactions from "@/components/dashboard/RecentTransactions"

export default async function DashboardPage() {
  // Session is already checked in layout, but we need it for data fetching
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect("/auth/login")
  }
  
  const userId = (session.user as any).id
  const userRole = session.user.role || "anggota"

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    // This should not happen if session is valid, but handle gracefully
    return <div>User not found</div>
  }

  // Get date ranges
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLast30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get transactions based on role
  const whereClause = userRole === "admin" || userRole === "bendahara"
    ? {}
    : { userId: user.id }

  // Get summary data
  const allTransactions = await prisma.transaction.findMany({
    where: whereClause,
  })

  const monthlyIncome = allTransactions
    .filter(tx => tx.type === "in" && tx.status === "success" && new Date(tx.createdAt) >= startOfMonth)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const monthlyExpense = allTransactions
    .filter(tx => tx.type === "out" && tx.status === "success" && new Date(tx.createdAt) >= startOfMonth)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalTransactions = allTransactions.length

  // Get last 30 days data for chart
  const last30DaysTransactions = allTransactions.filter(
    tx => new Date(tx.createdAt) >= startOfLast30Days && tx.status === "success"
  )

  // Group by date
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const dayTransactions = last30DaysTransactions.filter(
      tx => tx.createdAt.toISOString().split('T')[0] === dateStr
    )
    return {
      date: dateStr,
      income: dayTransactions.filter(tx => tx.type === "in").reduce((sum, tx) => sum + tx.amount, 0),
      expense: dayTransactions.filter(tx => tx.type === "out").reduce((sum, tx) => sum + tx.amount, 0),
    }
  })

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang kembali, {user.name}
            </p>
          </div>
          <Link href="/payment/create">
            <Button>
              <Wallet className="mr-2 h-4 w-4" />
              Setor Saldo
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Kas</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(user.balance)}</div>
              <p className="text-xs text-muted-foreground">
                Saldo saat ini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(monthlyIncome)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Bulan ini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(monthlyExpense)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                Bulan ini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Semua transaksi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <DashboardCharts dailyData={dailyData} />

        {/* Recent Transactions */}
        <RecentTransactions userId={userRole === "admin" || userRole === "bendahara" ? undefined : user.id} />
      </div>
  )
}
