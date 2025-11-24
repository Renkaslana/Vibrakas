import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TreasurerForm from "@/components/admin/TreasurerForm"

export default async function TreasurerPage() {
  // Session is already checked in layout, but we need it for role check
  const session = await getServerSession(authOptions)
  const userRole = session!.user.role || "anggota"

  if (userRole !== "admin" && userRole !== "bendahara") {
    redirect("/dashboard")
  }

  // Get all treasurer accounts
  const allAccounts = await prisma.treasurerAccount.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Sort by order field if available, then by createdAt
  const treasurerAccounts = allAccounts.sort((a: any, b: any) => {
    const orderA = (a as any).order ?? 0
    const orderB = (b as any).order ?? 0
    if (orderA !== orderB) {
      return orderA - orderB
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rekening Bendahara</h1>
          <p className="text-muted-foreground">
            Kelola informasi rekening tujuan untuk transfer manual
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Rekening</CardTitle>
            <CardDescription>
              Atur nama bank, nomor rekening, atas nama, dan QRIS statis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TreasurerForm initialData={treasurerAccounts} />
          </CardContent>
        </Card>
      </div>
  )
}

