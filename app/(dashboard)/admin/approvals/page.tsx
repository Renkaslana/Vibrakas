import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import ApprovalsClient from "@/components/admin/ApprovalsClient"

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = session.user.role || "anggota"

  // Only admin and bendahara can access this page
  if (userRole !== "admin" && userRole !== "bendahara") {
    redirect("/dashboard")
  }

  // Fetch all pending manual transfers
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      method: "manual",
      status: "pending",
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
    orderBy: {
      createdAt: "desc",
    },
  })

  return <ApprovalsClient transactions={pendingTransactions} />
}

