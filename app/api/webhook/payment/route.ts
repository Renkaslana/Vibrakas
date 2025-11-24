import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyTripaySignature } from '@/lib/verifySignature'
import { checkPaymentStatus } from '@/lib/payment'

// Disable body parsing, we need raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.json()
    const signature = request.headers.get('X-Callback-Signature') || ''

    // Verify signature (CRITICAL for security)
    // Skip signature verification in mock/development mode for testing
    const isMockMode = process.env.PAYMENT_API_KEY === 'test-api-key' || process.env.NODE_ENV === 'development'
    
    if (!isMockMode) {
      const isValid = verifyTripaySignature(
        body.merchant_ref || body.order_id || '',
        body.status || '',
        signature
      )

      if (!isValid) {
        console.error('Invalid webhook signature:', { body, signature })
        return NextResponse.json(
          { message: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.log('🔧 MOCK MODE: Skipping signature verification for testing')
    }

    // Extract transaction reference
    const transactionId = body.merchant_ref || body.order_id
    if (!transactionId) {
      return NextResponse.json(
        { message: 'Transaction ID not found' },
        { status: 400 }
      )
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    })

    if (!transaction) {
      console.error('Transaction not found:', transactionId)
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Prevent double processing (idempotency)
    if (transaction.status === 'success') {
      return NextResponse.json({ message: 'Already processed' })
    }

    const paymentStatus = body.status || body.transaction_status

    // Handle payment status
    if (paymentStatus === 'PAID' || paymentStatus === 'settlement') {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'success' },
      })

      // Add balance to user (idempotent - only if not already added)
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount, // Only add the amount, not totalAmount (fee already deducted)
          },
        },
      })

      console.log('Payment successful:', {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
      })
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'expire') {
      // Update transaction to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      })
    }

    return NextResponse.json({ message: 'Webhook processed' })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { message: 'Webhook processing error' },
      { status: 500 }
    )
  }
}

