import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface RecentTransactionsProps {
  userId?: string
}

export default async function RecentTransactions({ userId }: RecentTransactionsProps) {
  const whereClause = userId ? { userId } : {}

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    }
    const labels = {
      success: "Berhasil",
      failed: "Gagal",
      pending: "Pending",
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>10 transaksi terakhir</CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada transaksi
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {tx.type === "in" ? "Setor Saldo" : "Pengeluaran"} - {tx.method.toUpperCase()}
                    </p>
                    {getStatusBadge(tx.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userId ? formatDate(tx.createdAt) : `${tx.user.name} • ${formatDate(tx.createdAt)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "in" ? "+" : "-"} {formatCurrency(tx.amount)}
                  </p>
                  {tx.fee > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Fee: {formatCurrency(tx.fee)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

