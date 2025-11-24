import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import UsersTable from "@/components/admin/UsersTable"

export default async function AdminUsersPage() {
  // Session is already checked in layout, but we need it for role check
  const session = await getServerSession(authOptions)
  const userRole = session!.user.role || "anggota"

  if (userRole !== "admin" && userRole !== "bendahara") {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-muted-foreground">
            Kelola data anggota dan pengguna sistem
          </p>
        </div>

        <UsersTable users={users} />
      </div>
  )
}

