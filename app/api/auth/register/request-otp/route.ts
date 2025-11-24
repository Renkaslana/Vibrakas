import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendRegistrationOTP, generateOTP } from '@/lib/email'

/**
 * POST: Request OTP for registration
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otpCode = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing verification for this email
    await prisma.emailVerification.deleteMany({
      where: {
        email,
        purpose: 'register',
        isVerified: false,
      },
    })

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10)

    // Store registration data (password already hashed)
    const registrationData = JSON.stringify({
      name,
      email,
      passwordHash: hashedPassword,
    })

    // Create new verification record
    const verification = await prisma.emailVerification.create({
      data: {
        email,
        otpCode,
        otpExpires,
        purpose: 'register',
        registrationData, // Store hashed password
      },
    })

    // ALWAYS log OTP to console for development/testing
    console.log('\n' + '='.repeat(60))
    console.log('🔐 OTP CODE FOR REGISTRATION')
    console.log('='.repeat(60))
    console.log('Email:', email)
    console.log('Name:', name)
    console.log('OTP Code:', otpCode)
    console.log('Expires in: 10 minutes')
    console.log('='.repeat(60) + '\n')

    // Send OTP email
    const emailSent = await sendRegistrationOTP(email, otpCode, name)

    if (!emailSent) {
      // Still allow registration in development, but log warning
      console.warn('⚠️ Failed to send OTP email via SMTP, but OTP is shown above')
    } else {
      console.log('✅ OTP email sent successfully via SMTP')
    }

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

