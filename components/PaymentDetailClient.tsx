'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

interface Transaction {
  id: string
  method: string
  amount: number
  totalAmount: number
  fee: number
  status: string
  paymentId?: string | null
  qrisCode: string | null
  vaNumber: string | null
  proofImage?: string | null
  expiredAt: Date | string | null
  createdAt: Date | string
  approvedBy?: string | null
  approvedAt?: Date | string | null
  rejectedBy?: string | null
  rejectedAt?: Date | string | null
  user?: {
    id: string
    name: string
    email: string
  }
}

interface TreasurerAccount {
  bankName: string
  accountNumber: string
  accountName: string
  notes?: string | null
}

interface Approver {
  id: string
  name: string
  email: string
  role: string
}

interface Props {
  transaction: Transaction
  userRole?: string
  treasurerAccount?: TreasurerAccount | null
  approver?: Approver | null
  rejector?: Approver | null
}

export default function PaymentDetailClient({ transaction: initialTransaction, userRole = "anggota", treasurerAccount, approver, rejector }: Props) {
  const router = useRouter()
  const [transaction, setTransaction] = useState(initialTransaction)
  const [qrImage, setQrImage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Generate QR code image if QRIS
  useEffect(() => {
    if (transaction.method === 'qris' && transaction.qrisCode) {
      QRCode.toDataURL(transaction.qrisCode)
        .then((url) => setQrImage(url))
        .catch((err) => console.error('QR generation error:', err))
    }
  }, [transaction.qrisCode, transaction.method])

  // Calculate time remaining until expiration
  useEffect(() => {
    if (transaction.status === 'pending' && transaction.expiredAt) {
      const calculateTimeRemaining = () => {
        const now = new Date().getTime()
        const expired = new Date(transaction.expiredAt!).getTime()
        const remaining = Math.max(0, expired - now)
        setTimeRemaining(remaining)
        
        // If expired, update status
        if (remaining === 0) {
          setTransaction((prev) => ({ ...prev, status: 'failed' }))
        }
      }
      
      calculateTimeRemaining()
      const interval = setInterval(calculateTimeRemaining, 1000)
      
      return () => clearInterval(interval)
    } else {
      setTimeRemaining(null)
    }
  }, [transaction.status, transaction.expiredAt])

  // Auto-refresh status every 5 seconds
  // Also trigger payment gateway check for QRIS/VA payments
  useEffect(() => {
    if (transaction.status === 'pending') {
      const interval = setInterval(async () => {
        try {
          // First check status from database (which also checks payment gateway and expiration)
          const res = await fetch(`/api/payment/status/${transaction.id}`)
          const data = await res.json()
          
          if (data.status && data.status !== transaction.status) {
            setTransaction((prev) => ({ ...prev, status: data.status }))
            
            if (data.status === 'success') {
              router.refresh()
              setTimeout(() => {
                router.push('/dashboard')
              }, 2000)
            } else if (data.status === 'failed' && data.expired) {
              // Transaction expired - update UI
              setTransaction((prev) => ({ ...prev, status: 'failed' }))
              // Don't show alert, UI will show expired message
            }
          }

          // If still pending and has paymentId (QRIS/VA), also trigger manual check
          if (data.status === 'pending' && transaction.paymentId && transaction.method !== 'manual') {
            try {
              const checkRes = await fetch(`/api/payment/check/${transaction.id}`, {
                method: 'POST',
              })
              const checkData = await checkRes.json()
              
              if (checkData.updated && checkData.status !== transaction.status) {
                setTransaction((prev) => ({ ...prev, status: checkData.status }))
                
                if (checkData.status === 'success') {
                  router.refresh()
                  setTimeout(() => {
                    router.push('/dashboard')
                  }, 2000)
                }
              }
            } catch (checkError) {
              // Silent fail for manual check
              console.error('Manual check error:', checkError)
            }
          }
        } catch (error) {
          console.error('Status check error:', error)
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [transaction.status, transaction.id, transaction.paymentId, transaction.method, router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expired'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleConfirm = async (action: 'approve' | 'reject') => {
    if (!confirm(`Apakah Anda yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} transaksi ini?`)) {
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/manual-transfer/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id, action }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Gagal memproses')
        setProcessing(false)
        return
      }

      setTransaction((prev) => ({ ...prev, status: action === 'approve' ? 'success' : 'failed' }))
      router.refresh()
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally {
      setProcessing(false)
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detail Pembayaran</h1>
      </div>

      <div className="bg-card border rounded-lg p-6">
          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                transaction.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : transaction.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {transaction.status === 'success'
                ? '✓ Berhasil'
                : transaction.status === 'failed'
                ? '✗ Gagal'
                : '⏳ Menunggu Pembayaran'}
            </span>
          </div>

          {/* Payment Info */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Nominal</span>
              <span className="font-medium">{formatCurrency(transaction.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Biaya Admin</span>
              <span className="font-medium">{formatCurrency(transaction.fee)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-semibold">Total Bayar</span>
              <span className="text-gray-900 font-bold text-lg">
                {formatCurrency(transaction.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Metode</span>
              <span className="font-medium">{transaction.method.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Batas Waktu</span>
              <span className="font-medium">{formatDate(transaction.expiredAt)}</span>
            </div>
            {transaction.status === 'pending' && timeRemaining !== null && (
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Waktu Tersisa:</span>
                <span className={`font-bold text-lg ${
                  timeRemaining < 300000 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}
            {/* Check if expired (either status is failed due to expiry or expiredAt has passed) */}
            {(transaction.status === 'failed' || (transaction.status === 'pending' && transaction.expiredAt && new Date() > new Date(transaction.expiredAt))) && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⏰</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-2">
                      Transaksi QRIS Telah Expired
                </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      QRIS ini sudah tidak berlaku karena melewati batas waktu pembayaran (15 menit). 
                      QR code tidak dapat digunakan lagi untuk pembayaran.
                </p>
                    <button
                      onClick={() => router.push('/payment/create')}
                      className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      Buat Transaksi QRIS Baru
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Rekening Bendahara (untuk QRIS dari rekening bendahara) - Only for admin/bendahara */}
          {transaction.method === 'qris' && transaction.paymentId?.startsWith('TREASURER-') && treasurerAccount && (userRole === 'admin' || userRole === 'bendahara') && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">
                Transfer ke Rekening Bendahara:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                  <span className="font-medium">{treasurerAccount.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nomor Rekening:</span>
                  <span className="font-medium font-mono">{treasurerAccount.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Atas Nama:</span>
                  <span className="font-medium">{treasurerAccount.accountName}</span>
                </div>
                {treasurerAccount.notes && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400">{treasurerAccount.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QRIS Code - Only show if not expired */}
          {transaction.method === 'qris' && transaction.qrisCode && 
           !(transaction.status === 'failed' || (transaction.status === 'pending' && transaction.expiredAt && new Date() > new Date(transaction.expiredAt))) && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              {/* Check if this is mock QRIS */}
              {transaction.paymentId?.startsWith('MOCK-') ? (
                <>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-3">
                    <p className="text-sm text-red-800 dark:text-red-200 font-bold mb-2">
                      ⚠️ PERINGATAN: QRIS MOCK MODE
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                      QR Code ini <strong>TIDAK BISA di-scan</strong> oleh aplikasi bank (BCA Mobile, dll) karena masih menggunakan mode testing.
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      <strong>Penyebab:</strong> Payment Gateway belum di-setup. QRIS yang di-generate adalah mock data, bukan resmi.
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      <strong>Solusi:</strong> Setup Payment Gateway (Tripay/Midtrans/Xendit) untuk mendapatkan QRIS resmi.
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Lihat panduan lengkap di <code className="bg-red-100 dark:bg-red-900 px-1 rounded">QUICK_SETUP.md</code> atau <code className="bg-red-100 dark:bg-red-900 px-1 rounded">PAYMENT_GATEWAY_SETUP.md</code>
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    QR Code ini hanya untuk testing dan tidak bisa di-scan aplikasi bank
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg mb-3">
                    <p className="text-xs text-green-800 dark:text-green-200 font-medium mb-1">
                      ✅ QRIS Resmi dari Payment Gateway
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Scan QR code ini dengan aplikasi bank atau e-wallet Anda (BCA Mobile, OVO, GoPay, DANA, dll)
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Scan QR code berikut untuk melakukan pembayaran
                  </p>
                </>
              )}
              {qrImage ? (
                <div className="flex justify-center">
                  <img src={qrImage} alt="QRIS Code" className="w-64 h-64" />
                </div>
              ) : (
                <div className="flex justify-center items-center w-64 h-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded">
                  <p className="text-gray-500 dark:text-gray-400">Generating QR...</p>
                </div>
              )}
            </div>
          )}

          {/* Virtual Account */}
          {transaction.method === 'va' && transaction.vaNumber && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Nomor Virtual Account:</p>
              <p className="text-2xl font-bold text-center py-4 bg-background rounded border-2 border-dashed">
                {transaction.vaNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Transfer sesuai nominal ke nomor VA di atas
              </p>
            </div>
          )}

          {/* Proof Image for Manual Transfer */}
          {transaction.method === 'manual' && transaction.proofImage && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-3">Bukti Transfer:</p>
              <div className="flex justify-center">
                <img
                  src={transaction.proofImage}
                  alt="Bukti Transfer"
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            </div>
          )}

          {/* Transaction Details for Manual Transfer */}
          {transaction.method === 'manual' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">
                Informasi Transaksi:
              </p>
              <div className="space-y-2 text-sm">
                {transaction.user && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Nama Pengirim:</span>
                      <span className="font-medium">{transaction.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="font-medium">{transaction.user.email}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tanggal Transaksi:</span>
                  <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Hari:</span>
                  <span className="font-medium">
                    {new Date(transaction.createdAt).toLocaleDateString('id-ID', { weekday: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tahun:</span>
                  <span className="font-medium">
                    {new Date(transaction.createdAt).getFullYear()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Nominal:</span>
                  <span className="font-bold text-lg">{formatCurrency(transaction.amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Approval Information */}
          {transaction.method === 'manual' && transaction.status === 'success' && approver && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-green-900 dark:text-green-100">
                ✓ Transaksi Disetujui:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Disetujui oleh:</span>
                  <span className="font-medium">{approver.name} ({approver.role})</span>
                </div>
                {transaction.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Waktu Persetujuan:</span>
                    <span className="font-medium">{formatDate(transaction.approvedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Information */}
          {transaction.method === 'manual' && transaction.status === 'failed' && rejector && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-red-900 dark:text-red-100">
                ✗ Transaksi Ditolak:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ditolak oleh:</span>
                  <span className="font-medium">{rejector.name} ({rejector.role})</span>
                </div>
                {transaction.rejectedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Waktu Penolakan:</span>
                    <span className="font-medium">{formatDate(transaction.rejectedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto-refresh indicator */}
          {transaction.status === 'pending' && (
            <div className="text-center text-sm text-muted-foreground mb-4 space-y-2">
              <p>Memeriksa status pembayaran secara otomatis...</p>
              {transaction.method !== 'manual' && transaction.paymentId && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const res = await fetch(`/api/payment/check/${transaction.id}`, {
                          method: 'POST',
                        })
                        const data = await res.json()
                        
                        if (data.updated) {
                          setTransaction((prev) => ({ ...prev, status: data.status }))
                          if (data.status === 'success') {
                            router.refresh()
                            setTimeout(() => router.push('/dashboard'), 2000)
                          }
                        } else {
                          alert(data.message || 'Status masih pending')
                        }
                      } catch (error) {
                        alert('Gagal mengecek status pembayaran')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {loading ? 'Memeriksa...' : 'Cek Status Sekarang'}
                  </button>
                  
                </div>
              )}
            </div>
          )}

          {/* Admin Actions for Manual Transfer */}
          {transaction.method === 'manual' && transaction.status === 'pending' && (userRole === 'admin' || userRole === 'bendahara') && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium mb-3">Konfirmasi Transaksi:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirm('approve')}
                  disabled={processing}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Memproses...' : '✓ Setujui'}
                </button>
                <button
                  onClick={() => handleConfirm('reject')}
                  disabled={processing}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Memproses...' : '✗ Tolak'}
                </button>
              </div>
            </div>
          )}


          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-2 px-4 border rounded-md hover:bg-accent"
            >
              Kembali ke Dashboard
            </button>
            {transaction.status === 'success' && (
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Lihat Saldo
              </button>
            )}
            {/* Show button to create new transaction if expired */}
            {(transaction.status === 'failed' || (transaction.status === 'pending' && transaction.expiredAt && new Date() > new Date(transaction.expiredAt))) && (
              <button
                onClick={() => router.push('/payment/create')}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Buat Transaksi Baru
              </button>
            )}
          </div>
        </div>
    </div>
  )
}
