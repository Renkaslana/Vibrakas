import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'

/**
 * POST: Cleanup expired pending transactions
 * This will mark pending transactions as failed if they are expired
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"
    
    // Hanya admin dan bendahara yang bisa trigger cleanup manual
    // Tapi untuk auto-cleanup, bisa dipanggil tanpa auth (internal)
    const isAdmin = userRole === "admin" || userRole === "bendahara"
    const isInternal = request.headers.get('x-internal-request') === 'true'

    if (!isAdmin && !isInternal) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const now = new Date()
    const QRIS_EXPIRY_MINUTES = 15
    const VA_EXPIRY_HOURS = 24
    const MANUAL_EXPIRY_DAYS = 7 // Manual transfer expired after 7 days

    // Find all pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'pending',
      },
    })

    let expiredCount = 0
    const expiredIds: string[] = []
    const debugInfo: any[] = []

    console.log(`[CLEANUP] Checking ${pendingTransactions.length} pending transactions`)

    for (const transaction of pendingTransactions) {
      let shouldExpire = false
      let expiryTime: Date | null = null
      const createdAt = new Date(transaction.createdAt)
      const ageInMs = now.getTime() - createdAt.getTime()
      const ageInMinutes = Math.floor(ageInMs / (60 * 1000))
      const ageInHours = Math.floor(ageInMs / (60 * 60 * 1000))

      // Determine expiry time based on method
      let expectedExpiryMs: number
      if (transaction.method === 'qris') {
        expectedExpiryMs = QRIS_EXPIRY_MINUTES * 60 * 1000
      } else if (transaction.method === 'va') {
        expectedExpiryMs = VA_EXPIRY_HOURS * 60 * 60 * 1000
      } else if (transaction.method === 'manual') {
        expectedExpiryMs = MANUAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      } else {
        expectedExpiryMs = QRIS_EXPIRY_MINUTES * 60 * 1000 // Default
      }

      // Check if transaction has expiredAt
      if (transaction.expiredAt) {
        expiryTime = new Date(transaction.expiredAt)
        // If expiredAt is in the past, expire
        if (now > expiryTime) {
          shouldExpire = true
          console.log(`[CLEANUP] Transaction ${transaction.id} expired (expiredAt: ${expiryTime.toISOString()})`)
        } else {
          // If expiredAt is in the future, but transaction is older than expected expiry time, also expire
          // This handles cases where expiredAt was incorrectly set
          if (ageInMs > expectedExpiryMs) {
            shouldExpire = true
            console.log(`[CLEANUP] Transaction ${transaction.id} expired (age: ${ageInMinutes} minutes > expected ${Math.floor(expectedExpiryMs / 60000)} minutes, even though expiredAt is in future)`)
          }
        }
      } else {
        // If no expiredAt, calculate based on method and createdAt
        expiryTime = new Date(createdAt.getTime() + expectedExpiryMs)
        if (ageInMs > expectedExpiryMs) {
          shouldExpire = true
          console.log(`[CLEANUP] Transaction ${transaction.id} (${transaction.method}) expired - age: ${ageInMinutes} minutes`)
        }
      }

      debugInfo.push({
        id: transaction.id,
        method: transaction.method,
        createdAt: transaction.createdAt.toISOString ? transaction.createdAt.toISOString() : new Date(transaction.createdAt).toISOString(),
        expiredAt: transaction.expiredAt ? (transaction.expiredAt.toISOString ? transaction.expiredAt.toISOString() : new Date(transaction.expiredAt).toISOString()) : null,
        expiryTime: expiryTime?.toISOString(),
        shouldExpire,
        ageInMinutes: ageInMinutes,
        ageInHours: ageInHours,
        now: now.toISOString(),
      })

      if (shouldExpire) {
        try {
          // Update transaction to failed
          const result = await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'failed' },
          })
          expiredCount++
          expiredIds.push(transaction.id)
          console.log(`[CLEANUP] Successfully updated transaction ${transaction.id} to failed`)
        } catch (updateError: any) {
          console.error(`[CLEANUP] Failed to update transaction ${transaction.id}:`, updateError)
        }
      } else {
        console.log(`[CLEANUP] Transaction ${transaction.id} still valid - age: ${ageInMinutes} minutes, method: ${transaction.method}`)
      }
    }

    console.log(`[CLEANUP] Total expired: ${expiredCount} out of ${pendingTransactions.length}`)

    return NextResponse.json({
      success: true,
      message: `Berhasil mengubah ${expiredCount} transaksi expired menjadi failed`,
      expiredCount,
      expiredIds,
      totalChecked: pendingTransactions.length,
      debug: debugInfo, // Include debug info to help troubleshoot
    })
  } catch (error: any) {
    console.error('Cleanup expired transactions error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET: Check how many expired transactions exist (without updating)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"
    
    // Hanya admin dan bendahara yang bisa lihat
    if (userRole !== "admin" && userRole !== "bendahara") {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const now = new Date()
    const QRIS_EXPIRY_MINUTES = 15
    const VA_EXPIRY_HOURS = 24
    const MANUAL_EXPIRY_DAYS = 7

    // Find all pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'pending',
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

    const expiredTransactions = pendingTransactions.filter(transaction => {
      if (transaction.expiredAt) {
        return now > new Date(transaction.expiredAt)
      } else {
        const createdAt = new Date(transaction.createdAt)
        let expiryTime: Date

        if (transaction.method === 'qris') {
          expiryTime = new Date(createdAt.getTime() + QRIS_EXPIRY_MINUTES * 60 * 1000)
        } else if (transaction.method === 'va') {
          expiryTime = new Date(createdAt.getTime() + VA_EXPIRY_HOURS * 60 * 60 * 1000)
        } else if (transaction.method === 'manual') {
          expiryTime = new Date(createdAt.getTime() + MANUAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        } else {
          expiryTime = new Date(createdAt.getTime() + QRIS_EXPIRY_MINUTES * 60 * 1000)
        }

        return now > expiryTime
      }
    })

    return NextResponse.json({
      totalPending: pendingTransactions.length,
      expiredCount: expiredTransactions.length,
      expiredTransactions: expiredTransactions.map(tx => ({
        id: tx.id,
        userId: tx.userId,
        userName: tx.user?.name,
        userEmail: tx.user?.email,
        method: tx.method,
        amount: tx.amount,
        createdAt: tx.createdAt,
        expiredAt: tx.expiredAt,
      })),
    })
  } catch (error: any) {
    console.error('Check expired transactions error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: error.message },
      { status: 500 }
    )
  }
}

