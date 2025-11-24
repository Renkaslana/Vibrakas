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

    const userId = (session.user as any).id

    const formData = await request.formData()
    const amount = parseFloat(formData.get("amount") as string)
    const proofFile = formData.get("proof") as File
    const treasurerAccountId = formData.get("treasurerAccountId") as string | null

    if (!amount || amount < 10000) {
      return NextResponse.json(
        { message: "Minimum setor saldo adalah Rp 10.000" },
        { status: 400 }
      )
    }

    if (!proofFile || proofFile.size === 0) {
      return NextResponse.json(
        { message: "Harap upload bukti transfer" },
        { status: 400 }
      )
    }

    // Save proof image
    const bytes = await proofFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `proof-${Date.now()}.${proofFile.name.split('.').pop()}`
    const path = join(process.cwd(), "public", "uploads", "proofs", filename)
    
    // Create directory if it doesn't exist
    const fs = require("fs")
    const proofsDir = join(process.cwd(), "public", "uploads", "proofs")
    if (!fs.existsSync(proofsDir)) {
      fs.mkdirSync(proofsDir, { recursive: true })
    }

    await writeFile(path, buffer)
    const proofImagePath = `/uploads/proofs/${filename}`

    // Verify treasurer account exists if provided
    if (treasurerAccountId) {
      const account = await prisma.treasurerAccount.findUnique({
        where: { id: treasurerAccountId },
      })
      if (!account || !account.isActive) {
        return NextResponse.json(
          { message: "Rekening yang dipilih tidak valid atau tidak aktif" },
          { status: 400 }
        )
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: "in",
        method: "manual",
        amount,
        totalAmount: amount,
        fee: 0,
        status: "pending",
        proofImage: proofImagePath,
        treasurerAccountId: treasurerAccountId || null,
      },
    })

    return NextResponse.json({
      message: "Transaksi berhasil dibuat. Menunggu konfirmasi bendahara.",
      transactionId: transaction.id,
    })
  } catch (error: any) {
    console.error("Manual transfer creation error:", error)
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}

