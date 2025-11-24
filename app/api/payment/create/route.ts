import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'
import { createPayment, calculateFee } from '@/lib/payment'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const { amount, method } = await request.json()

    if (!amount || amount < 10000) {
      return NextResponse.json(
        { message: 'Minimum setor saldo adalah Rp 10.000' },
        { status: 400 }
      )
    }

    // QRIS feature is temporarily disabled
    if (method === 'qris') {
      return NextResponse.json(
        { message: 'Fitur QRIS sedang dalam tahap pengembangan dan sementara tidak tersedia' },
        { status: 400 }
      )
    }

    if (!method || !['qris', 'va'].includes(method)) {
      return NextResponse.json(
        { message: 'Metode pembayaran tidak valid' },
        { status: 400 }
      )
    }

    // Calculate fee and total
    const fee = calculateFee(amount, method)
    const totalAmount = amount + fee

    // Create transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'in',
        method,
        amount,
        fee,
        totalAmount,
        status: 'pending',
      },
    })

    // Create payment with Payment Gateway (QRIS Resmi)
    const paymentResult = await createPayment({
      method,
      amount,
      orderId: transaction.id,
      customerName: user.name,
      customerEmail: user.email,
      useTreasurerAccount: false, // Always use Payment Gateway for QRIS
      treasurerAccount: undefined,
    })

    if (!paymentResult.success || !paymentResult.data) {
      // Update transaction to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      })

      return NextResponse.json(
        { message: paymentResult.message || 'Gagal membuat pembayaran' },
        { status: 400 }
      )
    }

    // Ensure expiredAt is set (15 minutes for QRIS, 24 hours for VA)
    let expiredAt: Date
    if (paymentResult.data.expiredAt) {
      expiredAt = new Date(paymentResult.data.expiredAt)
    } else {
      // Fallback: calculate expired time based on method
      const QRIS_EXPIRY_MINUTES = 15
      const VA_EXPIRY_HOURS = 24
      expiredAt = method === 'qris'
        ? new Date(Date.now() + QRIS_EXPIRY_MINUTES * 60 * 1000)
        : new Date(Date.now() + VA_EXPIRY_HOURS * 60 * 60 * 1000)
    }

    // Update transaction with payment gateway data
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentId: paymentResult.data.reference,
        qrisCode: paymentResult.data.qrisCode || null,
        vaNumber: paymentResult.data.vaNumber || null,
        expiredAt: expiredAt,
      },
    })

    return NextResponse.json({
      message: 'Transaksi berhasil dibuat',
      transactionId: updatedTransaction.id,
    })
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

