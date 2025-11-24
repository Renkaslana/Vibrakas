import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"
import ReportsContent from "@/components/reports/ReportsContent"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { startDate?: string; endDate?: string }
}) {
  // Session is already checked in layout, but we need it for data fetching
  const session = await getServerSession(authOptions)
  const userId = (session!.user as any).id
  const userRole = session!.user.role || "anggota"

  // Get date range
  const startDate = searchParams.startDate 
    ? new Date(searchParams.startDate) 
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  
  const endDate = searchParams.endDate 
    ? new Date(searchParams.endDate) 
    : new Date()

  // Build where clause
  const whereClause: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (userRole !== "admin" && userRole !== "bendahara") {
    whereClause.userId = userId
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  // Calculate totals
  const totalIncome = transactions
    .filter(tx => tx.type === "in" && tx.status === "success")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalExpense = transactions
    .filter(tx => tx.type === "out" && tx.status === "success")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const netAmount = totalIncome - totalExpense

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h1>
          <p className="text-muted-foreground">
            Laporan pemasukan dan pengeluaran
          </p>
        </div>

        <ReportsContent
          transactions={transactions}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netAmount={netAmount}
          startDate={startDate.toISOString().split('T')[0]}
          endDate={endDate.toISOString().split('T')[0]}
          userRole={userRole}
        />
      </div>
  )
}

