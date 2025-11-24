import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { redirect } from "next/navigation"
import AdjustmentClient from "@/components/admin/AdjustmentClient"
import { prisma } from "@/lib/db"

export default async function AdjustmentPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userRole = session.user.role || "anggota"

  // Only admin and bendahara can access
  if (userRole !== "admin" && userRole !== "bendahara") {
    redirect("/dashboard")
  }

  // Get all users for selection
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      balance: true,
      role: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Koreksi Saldo</h1>
        <p className="text-muted-foreground">
          Buat adjustment transaction untuk mengoreksi saldo anggota
        </p>
      </div>

      <AdjustmentClient users={users} />
    </div>
  )
}

