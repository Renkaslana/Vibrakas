import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"
import { createAuditLog, getClientIP, getUserAgent } from "@/lib/audit"

/**
 * POST: Create an adjustment transaction to correct user balance
 * Only admin and bendahara can create adjustments
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"
    const userId = (session.user as any).id

    // Only admin and bendahara can create adjustments
    if (userRole !== "admin" && userRole !== "bendahara") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { targetUserId, amount, reason } = await request.json()

    if (!targetUserId || amount === undefined || !reason) {
      return NextResponse.json(
        { message: "User ID, amount, dan reason diperlukan" },
        { status: 400 }
      )
    }

    if (!reason.trim() || reason.trim().length < 10) {
      return NextResponse.json(
        { message: "Alasan adjustment diperlukan (minimal 10 karakter)" },
        { status: 400 }
      )
    }

    if (amount === 0) {
      return NextResponse.json(
        { message: "Amount tidak boleh 0" },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    const originalBalance = targetUser.balance
    const newBalance = originalBalance + amount

    // Create adjustment transaction
    const adjustment = await prisma.transaction.create({
      data: {
        userId: targetUserId,
        type: amount > 0 ? "in" : "out",
        method: "adjustment",
        amount: Math.abs(amount),
        totalAmount: Math.abs(amount),
        fee: 0,
        status: "success", // Adjustment is immediately successful
        isAdjustment: true,
        adjustmentReason: reason.trim(),
        originalBalance: originalBalance,
        newBalance: newBalance,
        approvedBy: userId,
        approvedAt: new Date(),
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
    })

    // Update user balance
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        balance: newBalance,
      },
    })

    // Create audit log
    await createAuditLog({
      action: "adjust",
      entityType: "balance",
      entityId: targetUserId,
      oldValue: { balance: originalBalance },
      newValue: { balance: newBalance },
      reason: reason.trim(),
      performedBy: userId,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    // Also log the transaction creation
    await createAuditLog({
      action: "create",
      entityType: "transaction",
      entityId: adjustment.id,
      oldValue: null,
      newValue: {
        id: adjustment.id,
        userId: targetUserId,
        type: adjustment.type,
        method: adjustment.method,
        amount: adjustment.amount,
        isAdjustment: true,
      },
      reason: reason.trim(),
      performedBy: userId,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({
      message: "Adjustment berhasil dibuat",
      transactionId: adjustment.id,
      originalBalance,
      newBalance,
      adjustmentAmount: amount,
    })
  } catch (error: any) {
    console.error("Adjustment transaction error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    )
  }
}

