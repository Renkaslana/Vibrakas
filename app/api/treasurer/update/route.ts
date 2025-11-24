import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import { prisma } from "@/lib/db"
import { writeFile } from "fs/promises"
import { join } from "path"

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

    const formData = await request.formData()
    const id = formData.get("id") as string | null // For update
    const bankName = formData.get("bankName") as string
    const accountName = formData.get("accountName") as string
    const accountNumber = formData.get("accountNumber") as string
    const notes = formData.get("notes") as string
    const qrisImageFile = formData.get("qrisImage") as File | null
    const isActive = formData.get("isActive") === "true"
    const order = parseInt(formData.get("order") as string) || 0

    // Check max 3 accounts
    const existingCount = await prisma.treasurerAccount.count({
      where: {
        isActive: true,
        ...(id ? { id: { not: id } } : {}), // Exclude current account if updating
      },
    })

    if (!id && existingCount >= 3) {
      return NextResponse.json(
        { message: "Maksimal 3 rekening aktif. Nonaktifkan rekening lain terlebih dahulu." },
        { status: 400 }
      )
    }

    let qrisImagePath: string | null = null

    // Handle file upload
    if (qrisImageFile && qrisImageFile.size > 0) {
      const bytes = await qrisImageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Save to public/uploads directory
      const filename = `qris-${Date.now()}.${qrisImageFile.name.split('.').pop()}`
      const path = join(process.cwd(), "public", "uploads", filename)
      
      // Create directory if it doesn't exist
      const fs = require("fs")
      const uploadsDir = join(process.cwd(), "public", "uploads")
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      await writeFile(path, buffer)
      qrisImagePath = `/uploads/${filename}`
    }

    if (id) {
      // Update existing
      const existing = await prisma.treasurerAccount.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json(
          { message: "Rekening tidak ditemukan" },
          { status: 404 }
        )
      }

      await prisma.treasurerAccount.update({
        where: { id },
        data: {
          bankName,
          accountName,
          accountNumber,
          notes: notes || null,
          qrisImage: qrisImagePath || existing.qrisImage,
          isActive,
          order,
        },
      })
    } else {
      // Create new
      await prisma.treasurerAccount.create({
        data: {
          bankName,
          accountName,
          accountNumber,
          notes: notes || null,
          qrisImage: qrisImagePath,
          isActive,
          order,
        },
      })
    }

    return NextResponse.json({ message: "Data berhasil disimpan" })
  } catch (error: any) {
    console.error("Treasurer update error:", error)
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
