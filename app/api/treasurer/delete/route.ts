import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"

    if (userRole !== "admin" && userRole !== "bendahara") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { message: "ID rekening diperlukan" },
        { status: 400 }
      )
    }

    // Check if account exists
    const account = await prisma.treasurerAccount.findUnique({
      where: { id },
    })

    if (!account) {
      return NextResponse.json(
        { message: "Rekening tidak ditemukan" },
        { status: 404 }
      )
    }

    // Delete account
    await prisma.treasurerAccount.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Rekening berhasil dihapus" })
  } catch (error: any) {
    console.error("Treasurer delete error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}

