import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"
import { createDataBackup } from "@/lib/backup"
import { getClientIP, getUserAgent } from "@/lib/audit"
import bcrypt from "bcryptjs"

const CONFIRM_TEXT = "HAPUS SEMUA DATA"

/**
 * POST: Reset all transaction data
 * Only admin can access this endpoint
 * Requires multiple confirmations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"
    const userId = (session.user as any).id

    // Only admin can reset data
    if (userRole !== "admin") {
      return NextResponse.json(
        { message: "Hanya admin yang dapat mengakses fitur ini" },
        { status: 403 }
      )
    }

    const { confirmText, password, reason } = await request.json()

    // Validation 1: Confirm text must match exactly
    if (confirmText !== CONFIRM_TEXT) {
      return NextResponse.json(
        { message: `Konfirmasi tidak valid. Ketik "${CONFIRM_TEXT}" dengan benar.` },
        { status: 400 }
      )
    }

    // Validation 2: Password must be provided
    if (!password) {
      return NextResponse.json(
        { message: "Password admin diperlukan" },
        { status: 400 }
      )
    }

    // Validation 3: Reason must be at least 20 characters
    if (!reason || reason.trim().length < 20) {
      return NextResponse.json(
        { message: "Alasan reset diperlukan (minimal 20 karakter)" },
        { status: 400 }
      )
    }

    // Get admin user to verify password
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!adminUser) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Validation 4: Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Password admin salah" },
        { status: 401 }
      )
    }

    // Get data summary before deletion
    const totalTransactions = await prisma.transaction.count()
    const totalAuditLogs = await prisma.auditLog.count()
    const totalUsers = await prisma.user.count()
    
    const balanceSum = await prisma.user.aggregate({
      _sum: {
        balance: true,
      },
    })
    const totalBalance = balanceSum._sum.balance || 0

    // Create backup before deletion
    let backupPath = ""
    try {
      backupPath = await createDataBackup()
      console.log("Backup created at:", backupPath)
    } catch (error) {
      console.error("Backup creation failed:", error)
      // Continue with reset even if backup fails, but log it
    }

    // Create reset log BEFORE deleting data
    const dataSummary = {
      totalTransactions,
      totalAuditLogs,
      totalUsers,
      totalBalance,
      backupPath: backupPath || "Backup gagal dibuat",
    }

    const resetLog = await prisma.dataResetLog.create({
      data: {
        performedBy: userId,
        reason: reason.trim(),
        dataSummary: JSON.stringify(dataSummary),
        totalTransactions,
        totalUsers,
        totalAuditLogs,
        totalBalance,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
      },
    })

    // Delete all transactions
    const deletedTransactions = await prisma.transaction.deleteMany({})

    // Reset all user balances to 0
    const resetBalances = await prisma.user.updateMany({
      data: {
        balance: 0,
      },
    })

    // Delete all audit logs
    const deletedAuditLogs = await prisma.auditLog.deleteMany({})

    console.log("Data reset completed:", {
      resetLogId: resetLog.id,
      deletedTransactions: deletedTransactions.count,
      resetBalances: resetBalances.count,
      deletedAuditLogs: deletedAuditLogs.count,
      backupPath,
    })

    return NextResponse.json({
      message: "Data berhasil direset",
      summary: {
        deletedTransactions: deletedTransactions.count,
        resetBalances: resetBalances.count,
        deletedAuditLogs: deletedAuditLogs.count,
        backupPath: backupPath || "Backup gagal dibuat",
      },
    })
  } catch (error: any) {
    console.error("Reset data error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET: Get data statistics for preview
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"

    // Only admin can view statistics
    if (userRole !== "admin") {
      return NextResponse.json(
        { message: "Hanya admin yang dapat mengakses fitur ini" },
        { status: 403 }
      )
    }

    // Get statistics
    const totalTransactions = await prisma.transaction.count()
    const totalAuditLogs = await prisma.auditLog.count()
    const totalUsers = await prisma.user.count()
    
    const balanceSum = await prisma.user.aggregate({
      _sum: {
        balance: true,
      },
    })
    const totalBalance = balanceSum._sum.balance || 0

    // Get recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      statistics: {
        totalTransactions,
        totalAuditLogs,
        totalUsers,
        totalBalance,
      },
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        userName: tx.user.name,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Get statistics error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}

