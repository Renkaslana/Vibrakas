'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, Trash2, Download } from "lucide-react"
import { useRouter } from "next/navigation"

interface Statistics {
  totalTransactions: number
  totalAuditLogs: number
  totalUsers: number
  totalBalance: number
}

interface RecentTransaction {
  id: string
  userName: string
  type: string
  amount: number
  status: string
  createdAt: string
}

export default function ResetDataForm() {
  const router = useRouter()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  
  // Form states
  const [understood, setUnderstood] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [password, setPassword] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const CONFIRM_TEXT = "HAPUS SEMUA DATA"

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const res = await fetch("/api/admin/reset-data")
      const data = await res.json()

      if (res.ok) {
        setStatistics(data.statistics)
        setRecentTransactions(data.recentTransactions || [])
      } else {
        setError(data.message || "Gagal memuat statistik")
      }
    } catch (err) {
      console.error("Fetch statistics error:", err)
      setError("Terjadi kesalahan saat memuat statistik")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setError("")

    // Validation
    if (confirmText !== CONFIRM_TEXT) {
      setError(`Konfirmasi tidak valid. Ketik "${CONFIRM_TEXT}" dengan benar.`)
      return
    }

    if (!password) {
      setError("Password admin diperlukan")
      return
    }

    if (!reason.trim() || reason.trim().length < 20) {
      setError("Alasan reset diperlukan (minimal 20 karakter)")
      return
    }

    setResetting(true)
    try {
      const res = await fetch("/api/admin/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmText,
          password,
          reason: reason.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert(
          `Data berhasil direset!\n\n` +
          `• ${data.summary.deletedTransactions} transaksi dihapus\n` +
          `• ${data.summary.resetBalances} saldo user direset\n` +
          `• ${data.summary.deletedAuditLogs} audit log dihapus\n\n` +
          `Backup: ${data.summary.backupPath || "Tidak tersedia"}`
        )
        
        // Reset form
        setConfirmDialogOpen(false)
        setConfirmText("")
        setPassword("")
        setReason("")
        setUnderstood(false)
        
        // Refresh statistics
        await fetchStatistics()
        router.refresh()
      } else {
        setError(data.message || "Gagal mereset data")
      }
    } catch (err) {
      console.error("Reset error:", err)
      setError("Terjadi kesalahan saat mereset data")
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Memuat statistik...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-600">Hapus Semua Data</CardTitle>
          </div>
          <CardDescription>
            Fitur ini akan menghapus semua transaksi, audit log, dan mereset saldo semua user ke 0.
            <strong className="block mt-2 text-red-600">
              ⚠️ PERINGATAN: Operasi ini TIDAK BISA DIBATALKAN!
            </strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Warning Section */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
              Data yang akan dihapus:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-300">
              <li>Semua transaksi ({statistics?.totalTransactions || 0} transaksi)</li>
              <li>Semua audit log ({statistics?.totalAuditLogs || 0} log)</li>
              <li>Saldo semua user (Total: {formatCurrency(statistics?.totalBalance || 0)})</li>
            </ul>

            <h3 className="font-semibold text-green-900 dark:text-green-200 mt-4 mb-2">
              Data yang TIDAK akan dihapus:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800 dark:text-green-300">
              <li>✓ Data anggota (User)</li>
              <li>✓ Rekening bendahara</li>
              <li>✓ Konfigurasi sistem</li>
            </ul>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Transaksi</p>
                <p className="text-lg font-bold">{statistics.totalTransactions}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Audit Log</p>
                <p className="text-lg font-bold">{statistics.totalAuditLogs}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total User</p>
                <p className="text-lg font-bold">{statistics.totalUsers}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Saldo</p>
                <p className="text-lg font-bold">{formatCurrency(statistics.totalBalance)}</p>
              </div>
            </div>
          )}

          {/* Recent Transactions Preview */}
          {recentTransactions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">10 Transaksi Terakhir:</h3>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="text-xs flex justify-between items-center">
                      <span>{tx.userName}</span>
                      <span className={tx.type === "in" ? "text-green-600" : "text-red-600"}>
                        {tx.type === "in" ? "+" : "-"} {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Checkbox
              id="understood"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked === true)}
            />
            <Label
              htmlFor="understood"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Saya mengerti bahwa operasi ini tidak bisa dibatalkan dan akan menghapus semua data transaksi, 
              audit log, dan mereset saldo semua user ke 0. Data anggota dan rekening bendahara akan tetap aman.
            </Label>
          </div>

          {/* Reset Button */}
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            disabled={!understood}
            onClick={() => setConfirmDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Hapus Semua Data
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Semua Data
            </DialogTitle>
            <DialogDescription>
              Anda yakin ingin menghapus semua data? Operasi ini tidak bisa dibatalkan!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Data yang akan dihapus:</p>
              <ul className="text-sm space-y-1">
                <li>• {statistics?.totalTransactions || 0} transaksi</li>
                <li>• {statistics?.totalAuditLogs || 0} audit log</li>
                <li>• Saldo semua user ({formatCurrency(statistics?.totalBalance || 0)})</li>
              </ul>
            </div>

            {/* Confirm Text Input */}
            <div className="space-y-2">
              <Label htmlFor="confirm-text">
                Ketik <strong>&quot;{CONFIRM_TEXT}&quot;</strong> untuk konfirmasi:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="font-mono"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password Admin:</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
              />
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Alasan Reset <span className="text-red-500">*</span> (minimal 20 karakter):
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Masukkan alasan mengapa Anda ingin mereset semua data..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/20 karakter minimum
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false)
                setConfirmText("")
                setPassword("")
                setReason("")
                setError("")
              }}
              disabled={resetting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={
                resetting ||
                confirmText !== CONFIRM_TEXT ||
                !password ||
                !reason.trim() ||
                reason.trim().length < 20
              }
            >
              {resetting ? "Memproses..." : "Hapus Semua Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

