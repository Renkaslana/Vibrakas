import crypto from 'crypto'

const PAYMENT_SECRET = process.env.PAYMENT_SECRET || ''

/**
 * Verify webhook signature from payment gateway
 * This is critical for security - never process webhooks without verification
 */
export function verifySignature(
  payload: string | object,
  signature: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const expectedSignature = crypto
      .createHmac(algorithm, PAYMENT_SECRET)
      .update(payloadString)
      .digest('hex')

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Alternative: Verify signature from request headers (Tripay style)
 */
export function verifyTripaySignature(
  merchantRef: string,
  status: string,
  signature: string
): boolean {
  try {
    const stringToSign = `${merchantRef}${status}${PAYMENT_SECRET}`
    const expectedSignature = crypto
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex')
    
    return expectedSignature === signature
  } catch (error) {
    console.error('Tripay signature verification error:', error)
    return false
  }
}

