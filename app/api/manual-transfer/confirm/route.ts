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

    const { transactionId, action } = await request.json()

    if (!transactionId || !action) {
      return NextResponse.json(
        { message: "Transaction ID dan action diperlukan" },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const approverName = session.user.name || "Unknown"

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaksi tidak ditemukan" },
        { status: 404 }
      )
    }

    if (transaction.status !== "pending") {
      return NextResponse.json(
        { message: "Transaksi sudah diproses" },
        { status: 400 }
      )
    }

    if (action === "approve") {
      const now = new Date()
      
      // Update transaction to success dengan catatan approval
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: "success",
          approvedBy: userId,
          approvedAt: now,
        },
      })

      // Add balance to user
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount,
          },
        },
      })
    } else if (action === "reject") {
      const now = new Date()
      
      // Update transaction to failed dengan catatan rejection
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: "failed",
          rejectedBy: userId,
          rejectedAt: now,
        },
      })
    } else {
      return NextResponse.json(
        { message: "Action tidak valid" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: `Transaksi berhasil di${action === "approve" ? "setujui" : "tolak"}`,
    })
  } catch (error: any) {
    console.error("Manual transfer confirm error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}

