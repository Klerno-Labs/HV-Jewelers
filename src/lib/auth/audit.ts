import { headers } from 'next/headers'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Admin and auth audit logging.
 *
 * Conventions for `action`:
 *   • Dot-namespaced: `<resource>.<event>`.
 *   • Auth events: `auth.signin.success`, `auth.signin.failure`,
 *     `auth.signout`, `auth.password.change`, `auth.role.change`.
 *   • Admin mutations: `<resource>.create`, `<resource>.update`,
 *     `<resource>.delete`, `<resource>.publish`, etc.
 *
 * Never include passwords, raw tokens, card data, or full session ids.
 */

export interface AuditArgs {
  actorId: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  before?: Prisma.InputJsonValue
  after?: Prisma.InputJsonValue
  context?: Prisma.InputJsonValue
  ip?: string | null
  userAgent?: string | null
}

export async function audit(args: AuditArgs) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: args.actorId ?? null,
        action: args.action,
        resourceType: args.resourceType,
        resourceId: args.resourceId ?? null,
        before: args.before ?? undefined,
        after: args.after ?? undefined,
        context: args.context ?? undefined,
        ip: args.ip ?? null,
        userAgent: args.userAgent ?? null,
      },
    })
  } catch (err) {
    // Never let audit-log failures break the operation. Log to stderr so
    // the operator sees it, but do not raise.
    console.error('[audit] write failed', err)
  }
}

/**
 * Pull request metadata from the current request's headers. Safe to call
 * from server components and server actions; returns nulls outside a
 * request scope rather than throwing.
 */
export async function auditRequestContext() {
  try {
    const h = await headers()
    const fwd = h.get('x-forwarded-for')
    const ip = fwd ? fwd.split(',')[0]?.trim() : (h.get('x-real-ip') ?? null)
    const userAgent = h.get('user-agent') ?? null
    return { ip: ip ?? null, userAgent }
  } catch {
    return { ip: null, userAgent: null }
  }
}
