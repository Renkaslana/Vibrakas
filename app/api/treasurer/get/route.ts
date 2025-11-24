import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get all active accounts
    const allAccounts = await prisma.treasurerAccount.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Sort by order field if available, then by createdAt
    const accounts = allAccounts.sort((a: any, b: any) => {
      const orderA = (a as any).order ?? 0
      const orderB = (b as any).order ?? 0
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    return NextResponse.json({ data: accounts })
  } catch (error: any) {
    console.error("Treasurer get error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
