import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'
import { checkPaymentStatus } from '@/lib/payment'

export async function GET(
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
    })

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check access: user can only see their own transactions unless admin/bendahara
    if (userRole !== "admin" && userRole !== "bendahara" && transaction.userId !== userId) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if transaction is expired (for QRIS/VA)
    if (transaction.status === 'pending' && transaction.expiredAt && 
        (transaction.method === 'qris' || transaction.method === 'va')) {
      const now = new Date()
      const expiredAt = new Date(transaction.expiredAt)
      
      if (now > expiredAt) {
        // Transaction expired, update status to failed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'failed' },
        })
        
        return NextResponse.json({
          status: 'failed',
          amount: transaction.amount,
          totalAmount: transaction.totalAmount,
          updated: true,
          expired: true,
          message: 'Transaksi telah expired. QRIS tidak dapat digunakan lagi. Silakan buat transaksi baru.',
        })
      }
    }

    // If transaction is pending and has paymentId, check status from payment gateway
    // Skip check for treasurer account transactions (no payment gateway)
    if (transaction.status === 'pending' && 
        transaction.paymentId && 
        transaction.method !== 'manual' &&
        !transaction.paymentId.startsWith('TREASURER-')) {
      try {
        const paymentStatus = await checkPaymentStatus(transaction.paymentId)
        
        // If payment is paid, update transaction and user balance
        if (paymentStatus.paid && paymentStatus.status === 'PAID') {
          // Update transaction status
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'success' },
          })

          // Add balance to user (only if not already added)
          const currentUser = await prisma.user.findUnique({
            where: { id: transaction.userId },
          })

          if (currentUser) {
            await prisma.user.update({
              where: { id: transaction.userId },
              data: {
                balance: {
                  increment: transaction.amount,
                },
              },
            })
          }

          return NextResponse.json({
            status: 'success',
            amount: transaction.amount,
            totalAmount: transaction.totalAmount,
            updated: true,
          })
        } else if (paymentStatus.status === 'FAILED' || paymentStatus.status === 'expire') {
          // Update transaction to failed
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'failed' },
          })

          return NextResponse.json({
            status: 'failed',
            amount: transaction.amount,
            totalAmount: transaction.totalAmount,
            updated: true,
          })
        }
      } catch (error) {
        // If payment gateway check fails, just return current status
        console.error('Payment gateway status check error:', error)
      }
    }

    return NextResponse.json({
      status: transaction.status,
      amount: transaction.amount,
      totalAmount: transaction.totalAmount,
      updated: false,
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

