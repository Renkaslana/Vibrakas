'use client'

import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  name: string
  email: string
  role: string
  balance: number
  createdAt: Date | string
  _count: {
    transactions: number
  }
}

interface UsersTableProps {
  users: User[]
}

export default function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal mengupdate role')
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteReason('')
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete || !deleteReason.trim() || deleteReason.trim().length < 10) {
      alert('Alasan penghapusan diperlukan (minimal 10 karakter)')
      return
    }

    setDeleting(userToDelete.id)
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToDelete.id,
          reason: deleteReason.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Gagal menghapus akun')
        setDeleting(null)
        return
      }

      setDeleteDialogOpen(false)
      setUserToDelete(null)
      setDeleteReason('')
      router.refresh()
    } catch (error) {
      alert('Terjadi kesalahan')
      setDeleting(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      bendahara: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      anggota: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || styles.anggota}`}>
        {role.toUpperCase()}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Daftar User</h3>
        <p className="text-sm text-muted-foreground">
          Total {users.length} pengguna
        </p>
      </div>
      <div>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada user
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4">Nama</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-right p-4">Saldo</th>
                  <th className="text-center p-4">Transaksi</th>
                  <th className="text-left p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(user.balance)}
                    </td>
                    <td className="p-4 text-center">
                      {user._count.transactions}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                          disabled={updating === user.id || deleting === user.id}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="anggota">Anggota</SelectItem>
                            <SelectItem value="bendahara">Bendahara</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {updating === user.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={updating === user.id || deleting === user.id || user.role === 'admin'}
                          title={user.role === 'admin' ? 'Tidak dapat menghapus akun admin' : 'Hapus akun'}
                        >
                          {deleting === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Akun User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
              <br />
              <br />
              <span className="text-red-600 font-semibold">
                ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan!
              </span>
              <br />
              <br />
              {userToDelete && userToDelete._count.transactions > 0 && (
                <span className="text-orange-600">
                  User ini memiliki {userToDelete._count.transactions} transaksi. 
                  User dengan transaksi tidak dapat dihapus. Silakan hapus transaksi terlebih dahulu atau gunakan fitur reset data.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">
                Alasan Penghapusan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="delete-reason"
                placeholder="Contoh: User memiliki 2 akun, akun ini adalah duplikat..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimal 10 karakter. Alasan ini akan dicatat dalam audit log.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
                setDeleteReason('')
              }}
              disabled={deleting !== null}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting !== null || !deleteReason.trim() || deleteReason.trim().length < 10}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus Akun'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

