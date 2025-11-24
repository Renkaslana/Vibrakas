import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"
import { createAuditLog, getClientIP, getUserAgent } from "@/lib/audit"

/**
 * POST: Soft delete a transaction
 * Only admin and bendahara can delete transactions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"
    const userId = (session.user as any).id

    // Only admin and bendahara can delete transactions
    if (userRole !== "admin" && userRole !== "bendahara") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { transactionId, reason } = await request.json()

    if (!transactionId) {
      return NextResponse.json(
        { message: "Transaction ID diperlukan" },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { message: "Alasan penghapusan diperlukan (minimal 10 karakter)" },
        { status: 400 }
      )
    }

    // Get transaction
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

    // Check if already deleted
    if (transaction.isDeleted) {
      return NextResponse.json(
        { message: "Transaksi sudah dihapus sebelumnya" },
        { status: 400 }
      )
    }

    // Store old value for audit
    const oldValue = {
      id: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      status: transaction.status,
      type: transaction.type,
      isDeleted: transaction.isDeleted,
    }

    const oldBalance = transaction.user.balance

    // Soft delete transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        deleteReason: reason.trim(),
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
    })

    // If transaction was successful, adjust user balance
    let newBalance = oldBalance
    if (transaction.status === "success") {
      if (transaction.type === "in") {
        // Subtract the amount that was added
        newBalance = oldBalance - transaction.amount
      } else if (transaction.type === "out") {
        // Add back the amount that was deducted
        newBalance = oldBalance + transaction.amount
      }

      // Update user balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: newBalance,
        },
      })
    }

    // Create audit log
    await createAuditLog({
      action: "delete",
      entityType: "transaction",
      entityId: transactionId,
      oldValue: oldValue,
      newValue: {
        ...oldValue,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        deleteReason: reason.trim(),
      },
      reason: reason.trim(),
      performedBy: userId,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    // Also log balance change if applicable
    if (transaction.status === "success") {
      await createAuditLog({
        action: "adjust",
        entityType: "balance",
        entityId: transaction.userId,
        oldValue: { balance: oldBalance },
        newValue: { balance: newBalance },
        reason: `Balance adjusted due to transaction deletion: ${transactionId}`,
        performedBy: userId,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
      })
    }

    return NextResponse.json({
      message: "Transaksi berhasil dihapus",
      balanceAdjusted: transaction.status === "success",
      oldBalance: transaction.status === "success" ? oldBalance : null,
      newBalance: transaction.status === "success" ? newBalance : null,
    })
  } catch (error: any) {
    console.error("Delete transaction error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    )
  }
}

