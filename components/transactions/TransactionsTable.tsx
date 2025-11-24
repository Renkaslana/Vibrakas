'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Transaction {
  id: string
  type: string
  method: string
  amount: number
  totalAmount: number
  fee: number
  status: string
  proofImage?: string | null
  createdAt: Date | string
  user?: {
    name: string
    email: string
  }
}

interface TransactionsTableProps {
  transactions: Transaction[]
  userRole: string
}

export default function TransactionsTable({ transactions, userRole }: TransactionsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cleaning, setCleaning] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/transactions?${params.toString()}`)
  }

  const handleDeleteClick = (tx: Transaction) => {
    setSelectedTransaction(tx)
    setDeleteReason("")
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTransaction) return

    if (!deleteReason.trim() || deleteReason.trim().length < 10) {
      alert("Alasan penghapusan diperlukan (minimal 10 karakter)")
      return
    }

    setDeleting(true)
    try {
      const res = await fetch("/api/transactions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          reason: deleteReason.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        setDeleteDialogOpen(false)
        setSelectedTransaction(null)
        setDeleteReason("")
        router.refresh()
      } else {
        alert(data.message || "Gagal menghapus transaksi")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Terjadi kesalahan saat menghapus transaksi")
    } finally {
      setDeleting(false)
    }
  }

  const handleCleanupExpired = async () => {
    if (!confirm('Apakah Anda yakin ingin mengubah semua transaksi expired menjadi failed?')) {
      return
    }

    setCleaning(true)
    try {
      const res = await fetch('/api/payment/cleanup-expired', {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        // Log detail lengkap
        console.log('=== CLEANUP RESULT ===')
        console.log('Total checked:', data.totalChecked)
        console.log('Expired count:', data.expiredCount)
        console.log('Expired IDs:', data.expiredIds)
        console.log('Debug info:', JSON.stringify(data.debug, null, 2))
        console.log('====================')
        
        if (data.expiredCount > 0) {
          alert(`Berhasil mengubah ${data.expiredCount} transaksi expired menjadi failed`)
        } else {
          // Tampilkan detail transaksi yang dicek
          if (data.debug && data.debug.length > 0) {
            const debugMsg = data.debug.map((tx: any) => 
              `ID: ${tx.id}, Method: ${tx.method}, Age: ${tx.ageInMinutes} menit, Should expire: ${tx.shouldExpire}`
            ).join('\n')
            console.log('Transaksi yang dicek:\n', debugMsg)
            alert(`Tidak ada transaksi expired. Detail:\n${debugMsg}`)
          } else {
            alert('Tidak ada transaksi expired yang ditemukan.')
          }
        }
        router.refresh()
      } else {
        console.error('Cleanup error:', data)
        alert(data.message || 'Gagal melakukan cleanup')
      }
    } catch (error) {
      console.error('Cleanup exception:', error)
      alert('Terjadi kesalahan saat melakukan cleanup')
    } finally {
      setCleaning(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    }
    const labels = {
      success: "Berhasil",
      failed: "Gagal",
      pending: "Pending",
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daftar Transaksi</CardTitle>
            <CardDescription>
              Total {transactions.length} transaksi
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={searchParams.get("status") || "all"}
              onValueChange={(v) => handleFilterChange("status", v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="success">Berhasil</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.get("method") || "all"}
              onValueChange={(v) => handleFilterChange("method", v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Metode</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
                <SelectItem value="va">VA</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            {(userRole === "admin" || userRole === "bendahara") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupExpired}
                disabled={cleaning}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${cleaning ? 'animate-spin' : ''}`} />
                {cleaning ? 'Memproses...' : 'Cleanup Expired'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada transaksi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Tanggal</th>
                  {userRole === "admin" || userRole === "bendahara" ? (
                    <th className="text-left p-4">User</th>
                  ) : null}
                  <th className="text-left p-4">Tipe</th>
                  <th className="text-left p-4">Metode</th>
                  <th className="text-right p-4">Nominal</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-center p-4">Aksi</th>
                  {(userRole === "admin" || userRole === "bendahara") && (
                    <th className="text-center p-4">Hapus</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 text-sm">
                      {formatDate(tx.createdAt)}
                    </td>
                    {userRole === "admin" || userRole === "bendahara" ? (
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{tx.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{tx.user?.email}</p>
                        </div>
                      </td>
                    ) : null}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.type === "in" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {tx.type === "in" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className="p-4 text-sm uppercase">{tx.method}</td>
                    <td className="p-4 text-right font-medium">
                      {tx.type === "in" ? "+" : "-"} {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="p-4 text-center">
                      <Link href={`/payment/${tx.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                    {(userRole === "admin" || userRole === "bendahara") && (
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(tx)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Transaksi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Transaksi akan dihapus secara soft delete dan saldo akan disesuaikan jika transaksi sudah berhasil.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Detail Transaksi</Label>
                <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
                  <p><strong>ID:</strong> {selectedTransaction.id}</p>
                  <p><strong>Tanggal:</strong> {formatDate(selectedTransaction.createdAt)}</p>
                  <p><strong>Nominal:</strong> {formatCurrency(selectedTransaction.amount)}</p>
                  <p><strong>Status:</strong> {selectedTransaction.status}</p>
                  {selectedTransaction.status === "success" && (
                    <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                      ⚠️ Saldo akan disesuaikan karena transaksi ini sudah berhasil
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete-reason">
                  Alasan Penghapusan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="delete-reason"
                  placeholder="Masukkan alasan penghapusan (minimal 10 karakter)..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimal 10 karakter. Alasan ini akan dicatat di audit log.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedTransaction(null)
                setDeleteReason("")
              }}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting || !deleteReason.trim() || deleteReason.trim().length < 10}
            >
              {deleting ? "Menghapus..." : "Hapus Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

