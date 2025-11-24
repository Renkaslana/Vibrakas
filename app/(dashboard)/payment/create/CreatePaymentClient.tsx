'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QrCode, CreditCard, Loader2, AlertCircle } from 'lucide-react'

interface CreatePaymentClientProps {
  userRole?: string
}

export default function CreatePaymentClient({ userRole = "anggota" }: CreatePaymentClientProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [paymentType, setPaymentType] = useState<'qris' | 'manual'>('manual')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [treasurerAccounts, setTreasurerAccounts] = useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  
  const isAdminOrBendahara = userRole === "admin" || userRole === "bendahara"

  // Format number with dots (e.g., 20000 -> 20.000)
  const formatNumberWithDots = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    // Add dots as thousand separators
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatNumberWithDots(inputValue)
    setAmountDisplay(formatted)
    // Store numeric value without dots
    const numericValue = inputValue.replace(/\D/g, '')
    setAmount(numericValue)
  }

  useEffect(() => {
    // Fetch treasurer accounts for manual transfer
    fetch('/api/treasurer/get')
      .then(res => {
        if (!res.ok) {
          // Silently handle 401 or other errors
          if (res.status === 401) {
            console.warn('Unauthorized access to treasurer account')
          }
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          setTreasurerAccounts(data.data)
          // Auto-select first account if available
          if (data.data.length === 1) {
            setSelectedAccountId(data.data[0].id)
          }
        }
      })
      .catch(err => {
        // Silently handle errors to avoid console noise
        console.error('Error fetching treasurer accounts:', err)
      })
  }, [])

  const handleQrisSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 10000) {
      setError('Minimum setor saldo adalah Rp 10.000')
      setLoading(false)
      return
    }

    try {
      console.log('Creating payment with amount:', amountNum)
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, method: 'qris' }),
      })

      const data = await res.json()
      console.log('Payment API response:', { status: res.status, data })

      if (!res.ok) {
        setError(data.message || 'Gagal membuat transaksi')
        setLoading(false)
        return
      }

      if (!data.transactionId) {
        setError('Transaksi berhasil dibuat tapi transactionId tidak ditemukan')
        setLoading(false)
        return
      }

      // Redirect to payment detail page
      console.log('Redirecting to payment detail:', data.transactionId)
      router.push(`/payment/${data.transactionId}`)
    } catch (err) {
      console.error('Payment creation error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 10000) {
      setError('Minimum setor saldo adalah Rp 10.000')
      setLoading(false)
      return
    }

    if (!proofFile) {
      setError('Harap upload bukti transfer')
      setLoading(false)
      return
    }

    if (!selectedAccountId) {
      setError('Harap pilih rekening tujuan')
      setLoading(false)
      return
    }

    if (treasurerAccounts.length === 0) {
      setError('Rekening bendahara belum diatur')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('amount', amountNum.toString())
      formData.append('proof', proofFile)
      formData.append('treasurerAccountId', selectedAccountId)

      const res = await fetch('/api/manual-transfer/create', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Gagal membuat transaksi')
        setLoading(false)
        return
      }

      // Redirect to payment detail page
      router.push(`/payment/${data.transactionId}`)
    } catch (err) {
      console.error('Manual transfer error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setor Saldo</h1>
        <p className="text-muted-foreground">
          Pilih metode pembayaran untuk top up saldo Anda
        </p>
      </div>

      <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as 'qris' | 'manual')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qris">
            <QrCode className="mr-2 h-4 w-4" />
            QRIS Otomatis
          </TabsTrigger>
          <TabsTrigger value="manual">
            <CreditCard className="mr-2 h-4 w-4" />
            Transfer Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qris">
          <Card>
            <CardHeader>
              <CardTitle>QRIS Otomatis</CardTitle>
              <CardDescription>
                Bayar dengan scan QR code menggunakan aplikasi bank atau e-wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg text-center">
                <div className="mb-4">
                  <div className="text-4xl mb-2">🚧</div>
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Fitur Sedang Dalam Tahap Pengembangan
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                    Fitur QRIS otomatis sedang dalam tahap pengembangan dan akan segera hadir.
                    <br />
                    Silakan gunakan fitur <strong>Transfer Manual</strong> untuk saat ini.
                  </p>
                </div>
                  <Button
                  onClick={() => setPaymentType('manual')}
                  className="mt-2"
                  >
                  Gunakan Transfer Manual
                  </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Manual ke Rekening Bendahara</CardTitle>
              <CardDescription>
                Transfer manual ke rekening bendahara dan upload bukti transfer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treasurerAccounts.length > 0 ? (
                <div className="space-y-6">
                  {/* Account Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="account-select">Pilih Rekening Tujuan</Label>
                    <select
                      id="account-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Rekening --</option>
                      {treasurerAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} - {account.accountNumber} ({account.accountName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Account Details - Only show for admin/bendahara */}
                  {selectedAccountId && isAdminOrBendahara && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                      {(() => {
                        const selectedAccount = treasurerAccounts.find(acc => acc.id === selectedAccountId)
                        if (!selectedAccount) return null
                        return (
                          <>
                    <h3 className="font-semibold">Rekening Tujuan:</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                                <span className="font-medium">{selectedAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nomor Rekening:</span>
                                <span className="font-medium font-mono">{selectedAccount.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Atas Nama:</span>
                                <span className="font-medium">{selectedAccount.accountName}</span>
                      </div>
                              {selectedAccount.qrisImage && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">QRIS Statis:</p>
                          <img
                                    src={selectedAccount.qrisImage}
                            alt="QRIS"
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                      )}
                              {selectedAccount.notes && (
                        <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs text-muted-foreground">{selectedAccount.notes}</p>
                        </div>
                      )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                  
                  {/* For anggota: Show minimal info */}
                  {selectedAccountId && !isAdminOrBendahara && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        ✓ Rekening tujuan telah dipilih. Silakan lanjutkan dengan mengisi nominal dan upload bukti transfer.
                      </p>
                  </div>
                  )}

                  <form onSubmit={handleManualSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="amount-manual">Nominal (Minimum Rp 10.000)</Label>
                      <Input
                        id="amount-manual"
                        type="text"
                        required
                        placeholder="10.000"
                        value={amountDisplay}
                        onChange={handleAmountChange}
                        inputMode="numeric"
                      />
                      {amount && parseFloat(amount) < 10000 && (
                        <p className="text-xs text-destructive">
                          Minimum setor saldo adalah Rp 10.000
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proof">Bukti Transfer</Label>
                      <Input
                        id="proof"
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setProofFile(file)
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload screenshot atau foto bukti transfer
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          'Kirim'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Rekening bendahara belum diatur. Silakan hubungi admin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

