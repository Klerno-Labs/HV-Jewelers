import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron/auth'
import { prisma } from '@/lib/prisma'

/**
 * Audit log retention.
 *
 * Operational actions (product.update, order.ship, etc.) are pruned
 * after 365 days. Auth events (auth.signin.*, auth.signout,
 * auth.password.*, auth.role.*) are retained longer — 730 days — so
 * we still have forensic records of sign-in activity at the usual
 * security-review interval.
 *
 * Scheduled daily at 04:00 UTC via cronjobs.org.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DAY_MS = 24 * 60 * 60 * 1000
const GENERAL_RETENTION_DAYS = 365
const AUTH_RETENTION_DAYS = 730

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()
    const generalCutoff = new Date(now - GENERAL_RETENTION_DAYS * DAY_MS)
    const authCutoff = new Date(now - AUTH_RETENTION_DAYS * DAY_MS)

    const [generalDeleted, authDeleted] = await Promise.all([
      prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: generalCutoff },
          NOT: { action: { startsWith: 'auth.' } },
        },
      }),
      prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: authCutoff },
          action: { startsWith: 'auth.' },
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      generalDeleted: generalDeleted.count,
      authDeleted: authDeleted.count,
    })
  } catch (err) {
    console.error('[cron/prune-audit] failed', err)
    return NextResponse.json({ error: 'prune failed' }, { status: 500 })
  }
}
