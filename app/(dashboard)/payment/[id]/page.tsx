import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/db'
import PaymentDetailClient from '@/components/PaymentDetailClient'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PaymentDetailPage({ params }: PageProps) {
  // Session is already checked in layout, but we need it for data fetching
  const session = await getServerSession(authOptions)
  const userId = (session!.user as any).id
  const userRole = session!.user.role || "anggota"

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  // Fetch approver info if exists
  let approver = null
  let rejector = null
  if (transaction && (transaction as any).approvedBy) {
    approver = await prisma.user.findUnique({
      where: { id: (transaction as any).approvedBy },
      select: { id: true, name: true, email: true, role: true },
    })
  }
  if (transaction && (transaction as any).rejectedBy) {
    rejector = await prisma.user.findUnique({
      where: { id: (transaction as any).rejectedBy },
      select: { id: true, name: true, email: true, role: true },
    })
  }

  if (!transaction) {
    redirect('/dashboard')
  }

  // Check access: user can only see their own transactions unless admin/bendahara
  if (userRole !== "admin" && userRole !== "bendahara" && transaction.userId !== userId) {
    redirect('/dashboard')
  }

  // Fetch rekening bendahara jika transaksi QRIS dari rekening bendahara
  let treasurerAccount = null
  if (transaction.method === 'qris' && transaction.paymentId?.startsWith('TREASURER-')) {
    treasurerAccount = await prisma.treasurerAccount.findFirst({
      orderBy: { updatedAt: 'desc' },
    })
  }

  return (
    <PaymentDetailClient 
      transaction={transaction} 
      userRole={userRole}
      treasurerAccount={treasurerAccount}
      approver={approver}
      rejector={rejector}
    />
  )
}

