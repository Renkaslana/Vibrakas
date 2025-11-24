'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  balance: number
  role: string
}

interface AdjustmentClientProps {
  users: User[]
}

export default function AdjustmentClient({ users }: AdjustmentClientProps) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!selectedUserId) {
      setError("Pilih user terlebih dahulu")
      return
    }

    // Parse amount, handling negative values
    const cleanAmount = amount.replace(/\./g, "").replace(/,/g, "")
    const amountNum = parseFloat(cleanAmount)
    
    if (isNaN(amountNum) || amountNum === 0) {
      setError("Nominal tidak valid. Gunakan nilai positif untuk menambah saldo atau nilai negatif untuk mengurangi saldo.")
      return
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setError("Alasan adjustment diperlukan (minimal 10 karakter)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/transactions/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUserId,
          amount: amountNum,
          reason: reason.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(
          `Adjustment berhasil! Saldo ${selectedUser?.name} berubah dari ${formatCurrency(data.originalBalance)} menjadi ${formatCurrency(data.newBalance)}`
        )
        setSelectedUserId("")
        setAmount("")
        setReason("")
        router.refresh()
      } else {
        setError(data.message || "Gagal membuat adjustment")
      }
    } catch (err) {
      console.error("Adjustment error:", err)
      setError("Terjadi kesalahan saat membuat adjustment")
    } finally {
      setLoading(false)
    }
  }

  const formatNumberWithDots = (value: string): string => {
    // Check if value starts with minus sign
    const isNegative = value.startsWith("-")
    // Remove all non-digit characters except minus at the start
    let numbers = value.replace(/[^\d-]/g, "")
    // Ensure minus is only at the start
    if (isNegative && !numbers.startsWith("-")) {
      numbers = "-" + numbers.replace(/-/g, "")
    } else if (!isNegative) {
      numbers = numbers.replace(/-/g, "")
    }
    
    if (!numbers || numbers === "-") return isNegative ? "-" : ""
    
    // Extract the numeric part (without minus)
    const numericPart = numbers.replace("-", "")
    if (!numericPart) return isNegative ? "-" : ""
    
    // Add dots as thousand separators
    const formatted = numericPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    
    return isNegative ? "-" + formatted : formatted
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatNumberWithDots(inputValue)
    setAmount(formatted)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Buat Adjustment Transaction</h3>
        <p className="text-sm text-muted-foreground">
          Gunakan fitur ini untuk mengoreksi saldo anggota. Adjustment akan langsung mempengaruhi saldo.
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="user-select">Pilih User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="-- Pilih User --" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email}) - Saldo: {formatCurrency(user.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Informasi User:</p>
              <div className="space-y-1 text-sm">
                <p><strong>Nama:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Saldo Saat Ini:</strong> {formatCurrency(selectedUser.balance)}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Nominal Adjustment</Label>
            <Input
              id="amount"
              type="text"
              placeholder="-10000 atau 50000"
              value={amount}
              onChange={handleAmountChange}
              inputMode="numeric"
              required
            />
            <p className="text-xs text-muted-foreground">
              <strong>Cara menggunakan:</strong> Ketik nilai negatif (-) untuk mengurangi saldo, atau nilai positif untuk menambah saldo.
              <br />
              <strong>Contoh:</strong> Ketik <code className="bg-muted px-1 rounded">-10000</code> untuk mengurangi Rp 10.000, atau <code className="bg-muted px-1 rounded">50000</code> untuk menambah Rp 50.000
            </p>
            {amount && selectedUser && (() => {
              const cleanAmount = amount.replace(/\./g, "").replace(/,/g, "")
              const amountNum = parseFloat(cleanAmount) || 0
              const newBalance = selectedUser.balance + amountNum
              return (
                <div className={`p-3 rounded-md ${
                  amountNum < 0 
                    ? "bg-red-50 dark:bg-red-900/20" 
                    : amountNum > 0 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "bg-blue-50 dark:bg-blue-900/20"
                }`}>
                  <p className="text-sm">
                    <strong>Saldo setelah adjustment:</strong>{" "}
                    <span className={amountNum < 0 ? "text-red-600 dark:text-red-400" : amountNum > 0 ? "text-green-600 dark:text-green-400" : ""}>
                      {formatCurrency(newBalance)}
                    </span>
                  </p>
                  {amountNum !== 0 && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      {amountNum < 0 ? "Mengurangi" : "Menambah"} saldo sebesar {formatCurrency(Math.abs(amountNum))}
                    </p>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Alasan Adjustment <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Masukkan alasan adjustment (minimal 10 karakter)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimal 10 karakter. Alasan ini akan dicatat di audit log.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedUserId("")
                setAmount("")
                setReason("")
                setError("")
                setSuccess("")
              }}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedUserId || !amount || !reason.trim() || reason.trim().length < 10}
              className="flex-1"
            >
              {loading ? "Memproses..." : "Buat Adjustment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

