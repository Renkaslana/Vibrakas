'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, Check, Plus, Trash2, Edit2, X } from 'lucide-react'

interface TreasurerAccount {
  id?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  qrisImage?: string | null
  notes?: string | null
  isActive?: boolean
  order?: number
}

interface TreasurerFormProps {
  initialData?: TreasurerAccount[]
}

export default function TreasurerForm({ initialData }: TreasurerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<TreasurerAccount[]>(initialData || [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    notes: '',
    qrisImage: null as File | null,
    isActive: true,
    order: 0,
  })

  useEffect(() => {
    if (initialData) {
      setAccounts(initialData)
    }
  }, [initialData])

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountName: '',
      accountNumber: '',
      notes: '',
      qrisImage: null,
      isActive: true,
      order: 0,
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleEdit = (account: TreasurerAccount) => {
    setFormData({
      bankName: account.bankName || '',
      accountName: account.accountName || '',
      accountNumber: account.accountNumber || '',
      notes: account.notes || '',
      qrisImage: null,
      isActive: account.isActive ?? true,
      order: account.order || 0,
    })
    setEditingId(account.id || null)
    setShowAddForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const accountId = editingId
    setLoading(accountId || 'new')
    setSuccess(null)

    try {
      const formDataToSend = new FormData()
      if (accountId) {
        formDataToSend.append('id', accountId)
      }
      formDataToSend.append('bankName', formData.bankName)
      formDataToSend.append('accountName', formData.accountName)
      formDataToSend.append('accountNumber', formData.accountNumber)
      formDataToSend.append('notes', formData.notes)
      formDataToSend.append('isActive', formData.isActive.toString())
      formDataToSend.append('order', formData.order.toString())
      if (formData.qrisImage) {
        formDataToSend.append('qrisImage', formData.qrisImage)
      }

      const res = await fetch('/api/treasurer/update', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Gagal menyimpan data')
        setLoading(null)
        return
      }

      setSuccess(accountId || 'new')
      resetForm()
      router.refresh()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rekening ini?')) {
      return
    }

    setLoading(id)
    try {
      const res = await fetch('/api/treasurer/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Gagal menghapus rekening')
        setLoading(null)
        return
      }

      router.refresh()
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally {
      setLoading(null)
    }
  }

  const activeAccounts = accounts.filter(acc => acc.isActive).length

  return (
    <div className="space-y-6">
      {/* Existing Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Daftar Rekening</h3>
            <p className="text-sm text-muted-foreground">
              Maksimal 3 rekening aktif. Saat ini: {activeAccounts} aktif
            </p>
          </div>
          {!showAddForm && activeAccounts < 3 && (
            <Button
              type="button"
              onClick={() => {
                resetForm()
                setShowAddForm(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Rekening
            </Button>
          )}
        </div>

        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada rekening. Klik &quot;Tambah Rekening&quot; untuk menambahkan.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className={!account.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {account.bankName}
                        {!account.isActive && (
                          <span className="text-xs font-normal text-muted-foreground">(Nonaktif)</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {account.accountNumber} - {account.accountName}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        disabled={loading !== null}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(account.id!)}
                        disabled={loading === account.id}
                      >
                        {loading === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {account.qrisImage && (
                  <CardContent>
                    <img
                      src={account.qrisImage}
                      alt="QRIS"
                      className="w-32 h-32 mx-auto rounded-lg border"
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-6 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Rekening' : 'Tambah Rekening Baru'}</h3>
              <p className="text-sm text-muted-foreground">
                {activeAccounts >= 3 && !editingId
                  ? 'Maksimal 3 rekening aktif. Nonaktifkan rekening lain terlebih dahulu.'
                  : 'Isi informasi rekening bendahara'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nama Bank</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Contoh: Bank BCA"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Nomor Rekening</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Contoh: 1234567890"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Atas Nama</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Contoh: YAYASAN VIBRA KAS"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="order">Urutan Tampilan</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Rekening dengan urutan lebih kecil akan ditampilkan lebih dulu
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <select
                    id="isActive"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qrisImage">Gambar QRIS Statis (Opsional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="qrisImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData({ ...formData, qrisImage: file })
                      }
                    }}
                  />
                </div>
                {formData.qrisImage && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      File dipilih: {formData.qrisImage.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan / Instruksi Pembayaran</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Transfer sesuai nominal yang tertera. Setelah transfer, upload bukti transfer."
                />
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={loading !== null || (activeAccounts >= 3 && !editingId)}>
                  {loading === (editingId || 'new') ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : success === (editingId || 'new') ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Berhasil Disimpan
                    </>
                  ) : (
                    editingId ? 'Update' : 'Simpan'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
