import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'

/**
 * API untuk verifikasi otomatis transaksi QRIS dari rekening bendahara
 * Admin/Bendahara bisa approve transaksi setelah memverifikasi transfer masuk
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"
    
    // Hanya admin dan bendahara yang bisa verify
    if (userRole !== "admin" && userRole !== "bendahara") {
      return NextResponse.json(
        { message: 'Hanya admin dan bendahara yang dapat memverifikasi transaksi' },
        { status: 403 }
      )
    }

    const { transactionId, action } = await request.json()

    if (!transactionId || !action) {
      return NextResponse.json(
        { message: 'Transaction ID dan action diperlukan' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Action harus approve atau reject' },
        { status: 400 }
      )
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hanya bisa verify transaksi QRIS dari rekening bendahara
    if (transaction.method !== 'qris' || !transaction.paymentId?.startsWith('TREASURER-')) {
      return NextResponse.json(
        { message: 'Hanya transaksi QRIS dari rekening bendahara yang dapat diverifikasi' },
        { status: 400 }
      )
    }

    // Prevent double processing
    if (transaction.status !== 'pending') {
      return NextResponse.json({
        message: `Transaksi sudah ${transaction.status === 'success' ? 'berhasil' : 'gagal'}`,
        status: transaction.status,
      })
    }

    if (action === 'approve') {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'success' },
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

      console.log('✅ Treasurer payment verified:', {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        verifiedBy: session.user.email,
      })

      return NextResponse.json({
        message: 'Pembayaran berhasil diverifikasi',
        status: 'success',
      })
    } else {
      // Reject transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      })

      return NextResponse.json({
        message: 'Transaksi ditolak',
        status: 'failed',
      })
    }
  } catch (error: any) {
    console.error('Verify treasurer payment error:', error)
    return NextResponse.json(
      { message: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

/**
 * GET: List pending transactions yang perlu diverifikasi
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

    // Get pending QRIS transactions from treasurer account
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        method: 'qris',
        status: 'pending',
        paymentId: {
          startsWith: 'TREASURER-',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      transactions: pendingTransactions,
      count: pendingTransactions.length,
    })
  } catch (error: any) {
    console.error('Get pending transactions error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

