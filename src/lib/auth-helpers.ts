import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/auth.config'

/**
 * Server-side role gates. Use these in every Server Component, Server
 * Action, and Route Handler that touches privileged data. Middleware is
 * a first line of defense, not the only one — always re-check on the
 * server.
 *
 * `requireSession` is cheap (JWT only). `requireRole` and friends do an
 * additional DB read so we can:
 *   • bounce sessions whose user has been disabled since their JWT was
 *     minted, and
 *   • reflect role changes (promotion to STAFF/ADMIN) without forcing a
 *     re-login.
 */

export interface SessionContext {
  user: {
    id: string
    email: string
    role: UserRole
    name?: string | null
  }
}

export async function getSession() {
  return auth()
}

export async function requireSession(): Promise<SessionContext> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      role: session.user.role,
      name: session.user.name ?? null,
    },
  }
}

/**
 * Re-validate the session against the live DB. Verifies the user still
 * exists, is not disabled, and re-reads their current role (so a promotion
 * takes effect on next request without re-login).
 */
export async function requireRole(allowed: UserRole[]): Promise<SessionContext> {
  const session = await requireSession()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, isDisabled: true },
  })
  if (!user || user.isDisabled) {
    // The JWT is stale or the user was disabled. Force the client back
    // to the login page; do not surface the reason.
    redirect('/login')
  }
  if (!allowed.includes(user.role)) {
    redirect('/')
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  }
}

export const requireStaffOrAdmin = () => requireRole(['STAFF', 'ADMIN'])
export const requireAdmin = () => requireRole(['ADMIN'])
