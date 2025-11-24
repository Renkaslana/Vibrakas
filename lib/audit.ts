import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"

interface CreateAuditLogParams {
  action: string
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  reason?: string
  performedBy: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        reason: params.reason || null,
        performedBy: params.performedBy,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw error - audit log failure shouldn't break the main operation
  }
}

/**
 * Get client IP address from NextRequest
 */
export function getClientIP(request: NextRequest): string | undefined {
  try {
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    
    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }
    if (realIP) {
      return realIP
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Get user agent from NextRequest
 */
export function getUserAgent(request: NextRequest): string | undefined {
  try {
    return request.headers.get("user-agent") || undefined
  } catch {
    return undefined
  }
}

