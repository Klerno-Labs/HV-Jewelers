import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'

const PAGE_SIZE = 100

export default async function AdminAuditPage() {
  await requireStaffOrAdmin()
  const events = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      action: true,
      resourceType: true,
      resourceId: true,
      ip: true,
      createdAt: true,
      context: true,
      actor: { select: { email: true, role: true } },
    },
  })

  return (
    <>
      <AdminPageHeader
        eyebrow="Settings"
        title="Audit Log"
        description="Sign-in attempts and admin mutations. Newest first; the most recent 100 events."
      />
      <AdminPageBody>
        <div className="border border-limestone-deep/60 bg-parchment">
          <table className="w-full text-caption">
            <thead className="border-b border-limestone-deep/60 text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-4 text-left">When</th>
                <th className="px-4 py-4 text-left">Actor</th>
                <th className="px-4 py-4 text-left">Action</th>
                <th className="px-4 py-4 text-left">Resource</th>
                <th className="px-4 py-4 text-left">IP</th>
                <th className="px-4 py-4 text-left">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-limestone-deep/40">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-ink-muted">
                    No audit events yet.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                      <time dateTime={e.createdAt.toISOString()}>
                        {e.createdAt.toLocaleString()}
                      </time>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {e.actor?.email ?? <span className="text-ink-muted">system</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink">{e.action}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {e.resourceType}
                      {e.resourceId ? (
                        <span className="ml-2 text-ink-muted">
                          {e.resourceId.slice(0, 12)}…
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{e.ip ?? '-'}</td>
                    <td className="max-w-md px-4 py-3 text-ink-muted">
                      <ContextCell value={e.context} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminPageBody>
    </>
  )
}

function ContextCell({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object') return <>-</>
  // Strip any unexpectedly large fields and never render anything that
  // could contain secrets. We pre-filter known keys we care about.
  const safe = pickSafe(value as Record<string, unknown>)
  const entries = Object.entries(safe)
  if (entries.length === 0) return <>-</>
  return (
    <span className="font-mono text-[11px] leading-relaxed">
      {entries
        .map(([k, v]) => `${k}=${shorten(String(v))}`)
        .join(' · ')}
    </span>
  )
}

const SAFE_KEYS = new Set(['reason', 'email', 'cartId', 'orderLineId', 'expiresAt'])

function pickSafe(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    if (SAFE_KEYS.has(k)) out[k] = v
  }
  return out
}

function shorten(value: string): string {
  return value.length > 60 ? `${value.slice(0, 57)}…` : value
}
