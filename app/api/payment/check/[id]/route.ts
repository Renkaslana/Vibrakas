import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'
import { checkPaymentStatus } from '@/lib/payment'

/**
 * Manual trigger untuk check payment status dari payment gateway
 * Berguna untuk testing atau jika webhook tidak datang
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = session.user.role || "anggota"

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check access: user can only check their own transactions unless admin/bendahara
    if (userRole !== "admin" && userRole !== "bendahara" && transaction.userId !== userId) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Only check if transaction is pending and has paymentId
    if (transaction.status !== 'pending' || !transaction.paymentId || transaction.method === 'manual') {
      return NextResponse.json({
        message: 'Transaction tidak perlu dicek',
        status: transaction.status,
      })
    }

    // Check payment status from gateway
    const paymentStatus = await checkPaymentStatus(transaction.paymentId)

    // If payment is paid, update transaction and user balance
    if (paymentStatus.paid && paymentStatus.status === 'PAID') {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'success' },
      })

      // Add balance to user (only if not already added)
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount,
          },
        },
      })

      return NextResponse.json({
        message: 'Pembayaran berhasil diverifikasi',
        status: 'success',
        updated: true,
      })
    } else if (paymentStatus.status === 'FAILED' || paymentStatus.status === 'expire') {
      // Update transaction to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      })

      return NextResponse.json({
        message: 'Pembayaran gagal atau expired',
        status: 'failed',
        updated: true,
      })
    }

    return NextResponse.json({
      message: 'Pembayaran masih pending',
      status: 'pending',
      gatewayStatus: paymentStatus.status,
      updated: false,
    })
  } catch (error: any) {
    console.error('Payment check error:', error)
    return NextResponse.json(
      { message: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

