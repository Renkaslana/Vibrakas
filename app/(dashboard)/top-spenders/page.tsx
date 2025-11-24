import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Trophy, Medal, Award } from "lucide-react"

export default async function TopSpendersPage() {
  // Session is already checked in layout

  // Get all successful income transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      type: "in",
      status: "success",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  // Group by user and sum amounts
  const userTotals = transactions.reduce((acc: any, tx) => {
    const userId = tx.userId
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: tx.user.name,
        userEmail: tx.user.email,
        total: 0,
        count: 0,
      }
    }
    acc[userId].total += tx.amount
    acc[userId].count += 1
    return acc
  }, {})

  // Sort by total (highest to lowest) and filter out zero amounts
  const topSpenders = Object.values(userTotals)
    .filter((item: any) => item.total > 0) // Only show members with setoran > 0
    .sort((a: any, b: any) => b.total - a.total) // Sort from highest to lowest

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Top Setoran Anggota</h1>
          <p className="text-muted-foreground">
            Ranking anggota dengan setoran terbanyak
          </p>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Peringkat Setoran</CardTitle>
            <CardDescription>
              {topSpenders.length > 0 
                ? `${topSpenders.length} anggota dengan setoran (diurutkan dari terbanyak ke terkecil)`
                : 'Belum ada anggota yang melakukan setoran'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSpenders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data
                </div>
              ) : (
                topSpenders.map((item: any, index) => {
                  const Icon = index === 0 ? Trophy : index === 1 ? Medal : Award
                  const color = index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-orange-500" : "text-muted-foreground"
                  
                  return (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${color} flex items-center justify-center w-12 h-12 rounded-full bg-muted`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">{item.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.count} transaksi
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(item.total)}</p>
                        <p className="text-sm text-muted-foreground">Rank #{index + 1}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}

