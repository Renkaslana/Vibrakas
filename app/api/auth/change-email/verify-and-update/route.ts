import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/audit'

/**
 * POST: Verify OTP and update email
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
    const { verificationId, otpCode, newEmail } = await request.json()

    if (!verificationId || !otpCode || !newEmail) {
      return NextResponse.json(
        { message: 'Verification ID, OTP code, dan email baru diperlukan' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { message: 'Format email baru tidak valid' },
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

    // Check if verification belongs to current user
    if (verification.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
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

    // Check if new email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email baru sudah digunakan oleh akun lain' },
        { status: 400 }
      )
    }

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

    // Store old value for audit
    const oldValue = {
      id: user.id,
      email: user.email,
    }

    // Update user email
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: true, // Mark as verified after change
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

    // Create audit log
    await createAuditLog({
      action: 'update',
      entityType: 'user',
      entityId: userId,
      oldValue: oldValue,
      newValue: { id: updatedUser.id, email: updatedUser.email },
      reason: 'User changed email address',
      performedBy: userId,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({
      message: 'Email berhasil diubah!',
      user: { id: updatedUser.id, email: updatedUser.email },
    })
  } catch (error: any) {
    console.error('Verify and update email error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: error.message },
      { status: 500 }
    )
  }
}

