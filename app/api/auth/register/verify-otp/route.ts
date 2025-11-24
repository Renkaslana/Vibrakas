import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken } from '@/lib/auth'

/**
 * POST: Verify OTP and create user account
 */
export async function POST(request: NextRequest) {
  try {
    const { verificationId, otpCode } = await request.json()

    if (!verificationId || !otpCode) {
      return NextResponse.json(
        { message: 'Verification ID dan OTP code diperlukan' },
        { status: 400 }
      )
    }

    // Get verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { id: verificationId },
    })

    if (!verification) {
      return NextResponse.json(
        { message: 'Verifikasi tidak ditemukan. Silakan request OTP lagi.' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (verification.isVerified) {
      return NextResponse.json(
        { message: 'Email sudah terverifikasi' },
        { status: 400 }
      )
    }

    // Check if OTP expired
    if (new Date() > verification.otpExpires) {
      return NextResponse.json(
        { message: 'OTP sudah kedaluwarsa. Silakan request OTP baru.' },
        { status: 400 }
      )
    }

    // Verify OTP
    if (verification.otpCode !== otpCode) {
      return NextResponse.json(
        { message: 'Kode OTP tidak valid' },
        { status: 400 }
      )
    }

    // Check if registration data exists
    if (!verification.registrationData) {
      return NextResponse.json(
        { message: 'Data registrasi tidak ditemukan. Silakan daftar ulang.' },
        { status: 400 }
      )
    }

    // Parse registration data
    let registrationData: { name: string; email: string; passwordHash: string }
    try {
      registrationData = JSON.parse(verification.registrationData)
    } catch (error) {
      return NextResponse.json(
        { message: 'Data registrasi tidak valid' },
        { status: 400 }
      )
    }

    // Verify email matches
    if (registrationData.email !== verification.email) {
      return NextResponse.json(
        { message: 'Email tidak sesuai' },
        { status: 400 }
      )
    }

    // Check if user already exists (double check)
    const existingUser = await prisma.user.findUnique({
      where: { email: verification.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if this is the first user (no admin exists)
    const adminExists = await prisma.user.findFirst({
      where: { role: 'admin' },
    })

    // Auto-admin untuk user pertama
    let userRole = 'anggota'
    if (!adminExists) {
      // First user automatically becomes admin
      userRole = 'admin'
      console.log('✅ First user automatically set as admin')
    }

    // Create user (password already hashed)
    const user = await prisma.user.create({
      data: {
        name: registrationData.name,
        email: verification.email,
        password: registrationData.passwordHash,
        role: userRole,
        balance: 0,
        emailVerified: true,
      },
    })

    // Mark verification as verified
    await prisma.emailVerification.update({
      where: { id: verificationId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    })

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email })

    // Set cookie
    const response = NextResponse.json({
      message: 'Registrasi berhasil! Email Anda telah diverifikasi.',
      user: { id: user.id, name: user.name, email: user.email },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: error.message },
      { status: 500 }
    )
  }
}

