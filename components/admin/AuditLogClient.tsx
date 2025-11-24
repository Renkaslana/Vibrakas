'use client'

import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  performedBy: string
  performedAt: Date | string
  ipAddress: string | null
  userAgent: string | null
  performer: {
    name: string
    email: string
  }
}

interface AuditLogClientProps {
  auditLogs: AuditLog[]
}

export default function AuditLogClient({ auditLogs }: AuditLogClientProps) {
  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      adjust: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      approve: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      reject: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      create: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      update: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    }
    return styles[action] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      delete: "Hapus",
      adjust: "Adjust",
      approve: "Setujui",
      reject: "Tolak",
      create: "Buat",
      update: "Update",
    }
    return labels[action] || action
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      transaction: "Transaksi",
      balance: "Saldo",
      user: "User",
      treasurer_account: "Rekening Bendahara",
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">History Audit Log</h3>
        <p className="text-sm text-muted-foreground">
          {auditLogs.length} log terakhir
        </p>
      </div>
      <div>
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada audit log
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionBadge(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getEntityTypeLabel(log.entityType)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.entityId.substring(0, 8)}...
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(log.performedAt)}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Dilakukan oleh:</strong> {log.performer.name} ({log.performer.email})
                  </p>
                  {log.reason && (
                    <p>
                      <strong>Alasan:</strong> {log.reason}
                    </p>
                  )}
                  {log.oldValue && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                      <strong>Nilai Lama:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words">
                        {JSON.stringify(JSON.parse(log.oldValue), null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.newValue && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                      <strong>Nilai Baru:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words">
                        {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.ipAddress && (
                    <p className="text-xs text-muted-foreground">
                      IP: {log.ipAddress}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

