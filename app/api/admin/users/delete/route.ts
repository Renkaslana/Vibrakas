import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"
import { createAuditLog, getClientIP, getUserAgent } from "@/lib/audit"

/**
 * POST: Delete a user account
 * Only admin can delete users
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"
    const adminId = (session.user as any).id

    // Only admin can delete users
    if (userRole !== "admin") {
      return NextResponse.json(
        { message: "Hanya admin yang dapat menghapus akun" },
        { status: 403 }
      )
    }

    const { userId, reason } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { message: "User ID diperlukan" },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { message: "Alasan penghapusan diperlukan (minimal 10 karakter)" },
        { status: 400 }
      )
    }

    // Get user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    if (!userToDelete) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (userToDelete.id === adminId) {
      return NextResponse.json(
        { message: "Anda tidak dapat menghapus akun sendiri" },
        { status: 400 }
      )
    }

    // Prevent deleting if user has transactions
    if (userToDelete._count.transactions > 0) {
      return NextResponse.json(
        { message: `User memiliki ${userToDelete._count.transactions} transaksi. Hapus transaksi terlebih dahulu atau gunakan fitur reset data.` },
        { status: 400 }
      )
    }

    // Store old value for audit
    const oldValue = {
      id: userToDelete.id,
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role,
      balance: userToDelete.balance,
    }

    // Create audit log BEFORE deleting user
    // This ensures the audit log is created while the user still exists
    await createAuditLog({
      action: "delete",
      entityType: "user",
      entityId: userId,
      oldValue: oldValue,
      newValue: null,
      reason: reason.trim(),
      performedBy: adminId,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    // Delete user (cascade will delete related transactions)
    // Note: Audit logs will remain because performedBy is stored as string
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      message: `Akun ${userToDelete.name} berhasil dihapus`,
    })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    )
  }
}

