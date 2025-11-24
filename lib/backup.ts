import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

interface BackupData {
  timestamp: string
  transactions: any[]
  auditLogs: any[]
  userBalances: Array<{
    userId: string
    userName: string
    email: string
    balance: number
  }>
  summary: {
    totalTransactions: number
    totalAuditLogs: number
    totalUsers: number
    totalBalance: number
  }
}

/**
 * Create backup of data before reset
 */
export async function createDataBackup(): Promise<string> {
  try {
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Get all audit logs
    const auditLogs = await prisma.auditLog.findMany({
      include: {
        performer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Get all user balances
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
      },
    })

    // Calculate summary
    const totalBalance = users.reduce((sum, user) => sum + user.balance, 0)

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      transactions: transactions.map((tx) => ({
        id: tx.id,
        userId: tx.userId,
        userName: tx.user.name,
        userEmail: tx.user.email,
        type: tx.type,
        method: tx.method,
        amount: tx.amount,
        totalAmount: tx.totalAmount,
        fee: tx.fee,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
        notes: tx.notes,
      })),
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        performedBy: log.performedBy,
        performerName: log.performer.name,
        performerEmail: log.performer.email,
        reason: log.reason,
        performedAt: log.performedAt.toISOString(),
      })),
      userBalances: users.map((user) => ({
        userId: user.id,
        userName: user.name,
        email: user.email,
        balance: user.balance,
      })),
      summary: {
        totalTransactions: transactions.length,
        totalAuditLogs: auditLogs.length,
        totalUsers: users.length,
        totalBalance: totalBalance,
      },
    }

    // Create backups directory if it doesn't exist
    const backupsDir = join(process.cwd(), "backups")
    try {
      await mkdir(backupsDir, { recursive: true })
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        throw error
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `reset-backup-${timestamp}.json`
    const filepath = join(backupsDir, filename)

    // Write backup file
    await writeFile(filepath, JSON.stringify(backupData, null, 2), "utf-8")

    return filepath
  } catch (error) {
    console.error("Backup creation error:", error)
    throw new Error("Gagal membuat backup data")
  }
}

