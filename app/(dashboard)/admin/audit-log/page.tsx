import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import AuditLogClient from "@/components/admin/AuditLogClient"

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userRole = session.user.role || "anggota"

  // Only admin and bendahara can access
  if (userRole !== "admin" && userRole !== "bendahara") {
    redirect("/dashboard")
  }

  // Get audit logs with user info
  const auditLogsRaw = await prisma.auditLog.findMany({
    orderBy: {
      performedAt: "desc",
    },
    take: 100, // Limit to last 100 logs
  })

  // Get user info for each log
  const auditLogs = await Promise.all(
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          History semua perubahan dan aktivitas sistem
        </p>
      </div>

      <AuditLogClient auditLogs={auditLogs} />
    </div>
  )
}

