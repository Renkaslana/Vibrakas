'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle2, XCircle, Eye, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  userId: string
  amount: number
  totalAmount: number
  fee: number
  status: string
  proofImage: string | null
  createdAt: Date | string
  user: {
    id: string
    name: string
    email: string
  }
}

interface ApprovalsClientProps {
  transactions: Transaction[]
}

export default function ApprovalsClient({ transactions: initialTransactions }: ApprovalsClientProps) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [processing, setProcessing] = useState<string | null>(null)

  const handleApprove = async (transactionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui transaksi ini? Uang akan ditambahkan ke saldo user.')) {
      return
    }

    setProcessing(transactionId)
    try {
      const res = await fetch('/api/manual-transfer/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action: 'approve' }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Gagal menyetujui transaksi')
        setProcessing(null)
        return
      }

      // Remove transaction from list
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId))
      alert('Transaksi berhasil disetujui! Saldo user telah ditambahkan.')
      router.refresh()
    } catch (error) {
      alert('Terjadi kesalahan saat menyetujui transaksi')
      setProcessing(null)
    }
  }

  const handleDecline = async (transactionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak transaksi ini? Status akan diubah menjadi gagal.')) {
      return
    }

    setProcessing(transactionId)
    try {
      const res = await fetch('/api/manual-transfer/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action: 'reject' }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Gagal menolak transaksi')
        setProcessing(null)
        return
      }

      // Remove transaction from list
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId))
      alert('Transaksi berhasil ditolak.')
      router.refresh()
    } catch (error) {
      alert('Terjadi kesalahan saat menolak transaksi')
      setProcessing(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Persetujuan Transfer</h1>
          <p className="text-muted-foreground">
            Kelola persetujuan transfer manual yang menunggu konfirmasi
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tidak Ada Transaksi Pending</h3>
            <p className="text-muted-foreground text-center">
              Semua transfer manual sudah diproses. Tidak ada transaksi yang menunggu persetujuan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan Transfer</h1>
        <p className="text-muted-foreground">
          {transactions.length} transfer manual menunggu persetujuan
        </p>
      </div>

      <div className="grid gap-6">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Transfer Manual - Menunggu Persetujuan
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Dibuat pada {formatDate(transaction.createdAt)}
                  </CardDescription>
                </div>
                <Link href={`/payment/${transaction.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* User Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-3">Informasi Pengirim:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama:</span>
                      <span className="font-medium">{transaction.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{transaction.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal Transfer:</span>
                      <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hari:</span>
                      <span className="font-medium">
                        {new Date(transaction.createdAt).toLocaleDateString('id-ID', { weekday: 'long' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tahun:</span>
                      <span className="font-medium">
                        {new Date(transaction.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold mb-3">Detail Transaksi:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nominal:</span>
                      <span className="font-bold text-lg">{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biaya Admin:</span>
                      <span className="font-medium">{formatCurrency(transaction.fee)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold">{formatCurrency(transaction.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Proof Image */}
                {transaction.proofImage && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-3">Bukti Transfer:</h3>
                    <div className="flex justify-center">
                      <img
                        src={transaction.proofImage}
                        alt="Bukti Transfer"
                        className="max-w-full h-auto rounded-lg border max-h-64"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(transaction.id)}
                    disabled={processing === transaction.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processing === transaction.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Setujui
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDecline(transaction.id)}
                    disabled={processing === transaction.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing === transaction.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Tolak
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

