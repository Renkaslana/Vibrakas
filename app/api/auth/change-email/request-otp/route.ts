import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'
import { sendChangeEmailOTP, generateOTP } from '@/lib/email'

/**
 * POST: Request OTP for change email (verify old email first)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Generate OTP
    const otpCode = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing verification for this user
    await prisma.emailVerification.deleteMany({
      where: {
        userId: userId,
        purpose: 'change_email',
        isVerified: false,
      },
    })

    // Create new verification record
    const verification = await prisma.emailVerification.create({
      data: {
        email: user.email, // Current email
        otpCode,
        otpExpires,
        purpose: 'change_email',
        userId: userId,
      },
    })

    // Send OTP email to current email
    const emailSent = await sendChangeEmailOTP(user.email, otpCode, user.name)

    if (!emailSent) {
      console.warn('Failed to send OTP email, but continuing in development mode')
    }

    // ALWAYS log OTP to console for development/testing
    console.log('\n' + '='.repeat(60))
    console.log('🔐 OTP CODE FOR CHANGE EMAIL')
    console.log('='.repeat(60))
    console.log('User:', user.name)
    console.log('Current Email:', user.email)
    console.log('OTP Code:', otpCode)
    console.log('Expires in: 10 minutes')
    console.log('='.repeat(60) + '\n')

    return NextResponse.json({
      message: 'OTP telah dikirim ke email Anda. Silakan cek inbox email Anda.',
      verificationId: verification.id,
    })
  } catch (error: any) {
    console.error('Request OTP error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: error.message },
      { status: 500 }
    )
  }
}

