import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TransactionsTable from "@/components/transactions/TransactionsTable"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { status?: string; method?: string; type?: string }
}) {
  // Session is already checked in layout, but we need it for data fetching
  const session = await getServerSession(authOptions)
  const userId = (session!.user as any).id
  const userRole = session!.user.role || "anggota"

  // Build where clause
  const whereClause: any = {
    isDeleted: false, // Exclude deleted transactions by default
  }
  
  if (userRole !== "admin" && userRole !== "bendahara") {
    whereClause.userId = userId
  }

  if (searchParams.status) {
    whereClause.status = searchParams.status
  }

  if (searchParams.method) {
    whereClause.method = searchParams.method
  }

  if (searchParams.type) {
    whereClause.type = searchParams.type
  }

  // Auto-cleanup expired transactions when page loads (only for admin/bendahara)
  if (userRole === "admin" || userRole === "bendahara") {
    try {
      const now = new Date()
      const QRIS_EXPIRY_MINUTES = 15
      const VA_EXPIRY_HOURS = 24
      const MANUAL_EXPIRY_DAYS = 7

      // Find all pending transactions
      const pendingTransactions = await prisma.transaction.findMany({
        where: {
          status: 'pending',
        },
      })

      // Update expired transactions to failed
      for (const transaction of pendingTransactions) {
        let shouldExpire = false

        const createdAt = new Date(transaction.createdAt)
        const ageInMs = now.getTime() - createdAt.getTime()

        // Determine expected expiry time based on method
        let expectedExpiryMs: number
        if (transaction.method === 'qris') {
          expectedExpiryMs = QRIS_EXPIRY_MINUTES * 60 * 1000
        } else if (transaction.method === 'va') {
          expectedExpiryMs = VA_EXPIRY_HOURS * 60 * 60 * 1000
        } else if (transaction.method === 'manual') {
          expectedExpiryMs = MANUAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        } else {
          expectedExpiryMs = QRIS_EXPIRY_MINUTES * 60 * 1000 // Default
        }

        if (transaction.expiredAt) {
          const expiredAt = new Date(transaction.expiredAt)
          // If expiredAt is in the past, expire
          if (now > expiredAt) {
            shouldExpire = true
          } else if (ageInMs > expectedExpiryMs) {
            // If expiredAt is in the future, but transaction is older than expected expiry time, also expire
            // This handles cases where expiredAt was incorrectly set
            shouldExpire = true
          }
        } else {
          // If no expiredAt, expire if older than expected expiry time
          if (ageInMs > expectedExpiryMs) {
            shouldExpire = true
          }
        }

        if (shouldExpire) {
          try {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'failed' },
            })
            console.log(`Auto-cleaned expired transaction: ${transaction.id}`)
          } catch (updateError) {
            console.error(`Failed to update transaction ${transaction.id}:`, updateError)
          }
        }
      }
    } catch (error) {
      // Silently fail if cleanup fails
      console.error('Cleanup expired transactions error:', error)
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaksi</h1>
          <p className="text-muted-foreground">
            Daftar semua transaksi {userRole === "admin" || userRole === "bendahara" ? "sistem" : "Anda"}
          </p>
        </div>

        <TransactionsTable transactions={transactions} userRole={userRole} />
      </div>
  )
}

