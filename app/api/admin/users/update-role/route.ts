import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "anggota"

    if (userRole !== "admin" && userRole !== "bendahara") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { message: "User ID dan role diperlukan" },
        { status: 400 }
      )
    }

    if (!["admin", "bendahara", "anggota"].includes(role)) {
      return NextResponse.json(
        { message: "Role tidak valid" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    return NextResponse.json({ message: "Role berhasil diupdate" })
  } catch (error: any) {
    console.error("Update role error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}

