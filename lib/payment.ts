// Payment Gateway Integration
// Using Tripay as example (gratis dan mudah webhook-nya)
// Anda bisa ganti ke Midtrans/Xendit sesuai kebutuhan

const TRIPAY_API_KEY = process.env.PAYMENT_API_KEY || ''
const TRIPAY_PRIVATE_KEY = process.env.PAYMENT_SECRET || ''
const TRIPAY_MERCHANT_CODE = process.env.PAYMENT_MERCHANT_CODE || ''
const TRIPAY_BASE_URL = process.env.PAYMENT_BASE_URL || 'https://tripay.co.id/api'

import crypto from 'crypto'
import { generateTreasurerQRIS } from './qris-generator'

export interface PaymentRequest {
  method: 'qris' | 'va'
  amount: number
  orderId: string
  customerName: string
  customerEmail: string
  useTreasurerAccount?: boolean // Jika true, gunakan rekening bendahara
  treasurerAccount?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
}

export interface PaymentResponse {
  success: boolean
  data?: {
    reference: string
    qrisCode?: string
    vaNumber?: string
    expiredAt: string
    totalAmount: number
  }
  message?: string
}

// Calculate fee based on payment method
export function calculateFee(amount: number, method: 'qris' | 'va'): number {
  // Contoh: QRIS fee 0.5%, VA fee 0.3%
  if (method === 'qris') {
    return Math.ceil(amount * 0.005) // 0.5%
  } else {
    return Math.ceil(amount * 0.003) // 0.3%
  }
}

// Generate signature for Tripay
function generateSignature(orderId: string, amount: number): string {
  const stringToSign = `${TRIPAY_MERCHANT_CODE}${orderId}${amount}${TRIPAY_PRIVATE_KEY}`
  return crypto.createHash('sha256').update(stringToSign).digest('hex')
}

// Create payment transaction
export async function createPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const fee = calculateFee(request.amount, request.method)
    const totalAmount = request.amount + fee

    // MODE: Menggunakan Rekening Bendahara (Treasurer Account)
    // Jika useTreasurerAccount = true, generate QRIS dari rekening bendahara
    if (request.useTreasurerAccount && request.treasurerAccount && request.method === 'qris') {
      console.log('🏦 TREASURER MODE: Using treasurer account for QRIS generation')
      
      const { bankName, accountNumber, accountName } = request.treasurerAccount
      
      // Generate QRIS dari rekening bendahara
      const qrisCode = generateTreasurerQRIS(
        bankName,
        accountNumber,
        accountName,
        totalAmount
      )
      
      // QRIS expired in 15 minutes
      const QRIS_EXPIRY_MINUTES = 15
      const expiredAt = new Date(Date.now() + QRIS_EXPIRY_MINUTES * 60 * 1000)
      
      return {
        success: true,
        data: {
          reference: `TREASURER-${request.orderId}-${Date.now()}`,
          qrisCode: qrisCode,
          vaNumber: undefined,
          expiredAt: expiredAt.toISOString(),
          totalAmount: totalAmount
        }
      }
    }

    // MOCK MODE: Jika menggunakan test keys, return mock data untuk testing
    if (TRIPAY_API_KEY === 'test-api-key' || process.env.NODE_ENV === 'development') {
      console.log('🔧 MOCK MODE: Using mock payment data for testing')
      
      // Simulasi delay network
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockQrisCode = '00020101021243650016COM.MIDTRANS.WWW011893600914' + 
        'MOCK_QRIS_CODE_FOR_TESTING_' + Date.now()
      const mockVaNumber = '1234567890' + Math.floor(Math.random() * 1000)
      
      // QRIS expired in 15 minutes, VA expired in 24 hours
      const QRIS_EXPIRY_MINUTES = 15
      const VA_EXPIRY_HOURS = 24
      const expiryTime = request.method === 'qris' 
        ? new Date(Date.now() + QRIS_EXPIRY_MINUTES * 60 * 1000)
        : new Date(Date.now() + VA_EXPIRY_HOURS * 60 * 60 * 1000)
      
      return {
        success: true,
        data: {
          reference: `MOCK-${request.orderId}-${Date.now()}`,
          qrisCode: request.method === 'qris' ? mockQrisCode : undefined,
          vaNumber: request.method === 'va' ? mockVaNumber : undefined,
          expiredAt: expiryTime.toISOString(),
          totalAmount: totalAmount
        }
      }
    }

    // PRODUCTION MODE: Real payment gateway call
    const channelCode = request.method === 'qris' ? 'QRIS' : 'BCAVA' // Contoh: BCA VA

    const signature = generateSignature(request.orderId, totalAmount)

    const payload = {
      method: channelCode,
      merchant_ref: request.orderId,
      amount: totalAmount,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      order_items: [
        {
          name: 'Top Up Saldo',
          price: request.amount,
          quantity: 1
        }
      ],
      signature: signature
    }

    const response = await fetch(`${TRIPAY_BASE_URL}/transaction/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.success) {
      // QRIS expired in 15 minutes, VA expired in 24 hours
      // Use expired_time from gateway if available, otherwise calculate
      const QRIS_EXPIRY_MINUTES = 15
      const VA_EXPIRY_HOURS = 24
      let expiredAt: string
      
      if (data.data.expired_time) {
        expiredAt = data.data.expired_time
      } else {
        // Fallback: calculate expired time based on method
        const expiryTime = request.method === 'qris'
          ? new Date(Date.now() + QRIS_EXPIRY_MINUTES * 60 * 1000)
          : new Date(Date.now() + VA_EXPIRY_HOURS * 60 * 60 * 1000)
        expiredAt = expiryTime.toISOString()
      }
      
      return {
        success: true,
        data: {
          reference: data.data.reference,
          qrisCode: data.data.qr_string || undefined,
          vaNumber: data.data.pay_code || undefined,
          expiredAt: expiredAt,
          totalAmount: totalAmount
        }
      }
    } else {
      return {
        success: false,
        message: data.message || 'Failed to create payment'
      }
    }
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return {
      success: false,
      message: error.message || 'Payment gateway error'
    }
  }
}

// Verify webhook signature
export function verifyWebhookSignature(payload: any, signature: string): boolean {
  try {
    const stringToSign = `${payload.merchant_ref}${payload.status}${TRIPAY_PRIVATE_KEY}`
    const expectedSignature = crypto.createHash('sha256').update(stringToSign).digest('hex')
    return expectedSignature === signature
  } catch (error) {
    return false
  }
}

// Check payment status
export async function checkPaymentStatus(reference: string): Promise<{ status: string; paid: boolean }> {
  try {
    // MOCK MODE: For testing without real payment gateway
    if (TRIPAY_API_KEY === 'test-api-key' || process.env.NODE_ENV === 'development') {
      // In mock mode, we simulate that payment is still pending
      // For testing, you can manually update status via webhook or database
      return { status: 'PENDING', paid: false }
    }

    // PRODUCTION MODE: Check real payment gateway
    const response = await fetch(`${TRIPAY_BASE_URL}/transaction/detail?reference=${reference}`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
      }
    })

    const data = await response.json()

    if (data.success) {
      return {
        status: data.data.status,
        paid: data.data.status === 'PAID'
      }
    }

    return { status: 'UNKNOWN', paid: false }
  } catch (error) {
    console.error('Payment status check error:', error)
    return { status: 'ERROR', paid: false }
  }
}

