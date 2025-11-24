import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  email: string
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(request: Request): Promise<{ id: string; email: string; name: string; balance: number } | null> {
  try {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null

    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...vals] = c.split('=')
        return [key, vals.join('=')]
      })
    )
    const token = cookies.token
    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, balance: true }
    })

    return user
  } catch (error) {
    return null
  }
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

