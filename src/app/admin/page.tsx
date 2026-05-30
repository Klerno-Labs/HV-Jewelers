import Link from 'next/link'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'

/**
 * Admin dashboard, post-Shopify migration. Catalog, inventory, orders,
 * customers, and shipping all live in Shopify admin now — the cards
 * below deep-link out. In-app surfaces (Policies, Users, Audit Log)
 * stay because Shopify can't reach them.
 */

const SHOPIFY_ADMIN = 'https://zvf91s-qy.myshopify.com/admin'

const SHOPIFY_LINKS: Array<{ label: string; href: string; description: string }> = [
  { label: 'Products', href: `${SHOPIFY_ADMIN}/products`, description: 'Add, edit, archive pieces. /shop on the site renders from here.' },
  { label: 'Inventory', href: `${SHOPIFY_ADMIN}/products/inventory`, description: 'Adjust on-hand counts and locations.' },
  { label: 'Orders', href: `${SHOPIFY_ADMIN}/orders`, description: 'Fulfillment, tracking, refunds — managed in Shopify.' },
  { label: 'Customers', href: `${SHOPIFY_ADMIN}/customers`, description: 'Profiles, marketing opt-ins, order history.' },
  { label: 'Discounts', href: `${SHOPIFY_ADMIN}/discounts`, description: 'Promo codes and automatic discounts.' },
  { label: 'Shipping', href: `${SHOPIFY_ADMIN}/settings/shipping`, description: 'Rates, zones, carrier integrations.' },
]

const IN_APP_LINKS: Array<{ label: string; href: string; description: string }> = [
  { label: 'Policies', href: '/admin/policies', description: 'Era policy reference (final-sale, return windows).' },
  { label: 'Users & Staff', href: '/admin/users', description: 'Invite admin/staff members; manage roles.' },
  { label: 'Audit Log', href: '/admin/audit', description: 'Sign-ins and admin mutations.' },
]

export default async function AdminDashboard() {
  const { user } = await requireStaffOrAdmin()

  const recentEvents = await prisma.auditLog
    .findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    })
    .catch(() => [])

  return (
    <>
      <AdminPageHeader
        eyebrow={`Welcome, ${user.name ?? user.email.split('@')[0]}`}
        title="Operations"
        description="The catalog, orders, and customers live in Shopify admin. This dashboard handles the in-app pieces and links out to the rest."
      />
      <AdminPageBody>
        {/* ─── Shopify deep links ─── */}
        <section aria-label="Shopify admin">
          <div className="mb-4 flex items-baseline justify-between border-b border-limestone-deep/60 pb-3">
            <h2 className="font-serif text-title text-ink">Shopify</h2>
            <a
              href={SHOPIFY_ADMIN}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
            >
              Open Shopify admin →
            </a>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHOPIFY_LINKS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-greek-terracotta/20 bg-parchment px-5 py-4 transition-colors hover:border-greek-teal"
                >
                  <p className="font-serif text-title text-ink">
                    {item.label} <span aria-hidden className="ml-1 text-bronze">↗</span>
                  </p>
                  <p className="mt-2 text-caption text-ink-soft">{item.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── In-app links ─── */}
        <section aria-label="In-app admin" className="mt-12">
          <div className="mb-4 flex items-baseline justify-between border-b border-limestone-deep/60 pb-3">
            <h2 className="font-serif text-title text-ink">In-app</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IN_APP_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border border-limestone-deep/60 bg-parchment px-5 py-4 transition-colors hover:border-olive"
                >
                  <p className="font-serif text-title text-ink">{item.label}</p>
                  <p className="mt-2 text-caption text-ink-soft">{item.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── Recent admin activity ─── */}
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between border-b border-limestone-deep/60 pb-3">
            <h2 className="font-serif text-title text-ink">Recent activity</h2>
            <Link
              href="/admin/audit"
              className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
            >
              Audit log →
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-caption text-ink-muted">
              Sign-ins and admin mutations will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-limestone-deep/40 border-y border-limestone-deep/40 bg-parchment">
              {recentEvents.map((e) => (
                <li
                  key={e.id}
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-caption"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-ink">{e.action}</span>
                    <span className="ml-3 text-ink-muted">
                      {e.resourceType}
                      {e.resourceId ? ` · ${e.resourceId.slice(0, 8)}…` : ''}
                    </span>
                    {e.actor?.email ? (
                      <span className="ml-3 text-ink-muted">{e.actor.email}</span>
                    ) : null}
                  </div>
                  <time
                    dateTime={e.createdAt.toISOString()}
                    className="text-ink-muted"
                  >
                    {formatRelative(e.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AdminPageBody>
    </>
  )
}

function formatRelative(d: Date): string {
  const ms = Date.now() - d.getTime()
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}h ago`
  const days = Math.round(h / 24)
  return `${days}d ago`
}
