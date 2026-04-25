import Link from 'next/link'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { StatusPill } from '@/components/admin/status-pill'
import { Price } from '@/components/store/price'

/**
 * Admin dashboard — calm, numeric. Revenue rolled up from PAID orders,
 * excluding refunds. Today / 7-day / 30-day slices. Operational
 * shortcuts for unfulfilled and pending.
 */

function startOf(daysAgo: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}

async function revenueSince(since: Date): Promise<number> {
  // Only statuses that represent real revenue — not PENDING, not CANCELLED.
  const rows = await prisma.order.aggregate({
    where: {
      paidAt: { gte: since },
      status: {
        in: ['PAID', 'SHIPPED', 'DELIVERED', 'PARTIALLY_REFUNDED', 'REFUNDED'],
      },
    },
    _sum: {
      totalCents: true,
      totalRefundedCents: true,
    },
  })
  const gross = rows._sum.totalCents ?? 0
  const refunded = rows._sum.totalRefundedCents ?? 0
  return Math.max(0, gross - refunded)
}

export default async function AdminDashboard() {
  const { user } = await requireStaffOrAdmin()

  const [
    revenueToday,
    revenue7d,
    revenue30d,
    productsActive,
    inventoryAvailable,
    inventoryReserved,
    ordersPending,
    ordersUnfulfilled,
    ordersShipped,
    recentOrders,
    recentEvents,
    lowStock,
  ] = await Promise.all([
    revenueSince(startOf(0)),
    revenueSince(startOf(7)),
    revenueSince(startOf(30)),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.inventoryItem.count({ where: { status: 'AVAILABLE' } }),
    prisma.inventoryItem.count({ where: { status: 'RESERVED' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({
      where: {
        status: 'PAID',
        fulfillmentStatus: { in: ['UNFULFILLED', 'PROCESSING'] },
      },
    }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
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
    }),
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isHidden: false,
        stockMode: { not: 'MADE_TO_ORDER' },
        inventoryItems: {
          none: { status: 'AVAILABLE' },
        },
      },
      select: { id: true, slug: true, title: true, era: true },
      take: 6,
    }),
  ])

  return (
    <>
      <AdminPageHeader
        eyebrow={`Welcome, ${user.name ?? user.email.split('@')[0]}`}
        title="Operations"
        description="A quick read on revenue and the floor."
      />
      <AdminPageBody>
        {/* ─── Revenue ─── */}
        <section aria-label="Revenue" className="grid gap-4 md:grid-cols-3">
          <RevenueStat label="Revenue · today" cents={revenueToday} />
          <RevenueStat label="Revenue · 7 days" cents={revenue7d} />
          <RevenueStat label="Revenue · 30 days" cents={revenue30d} />
        </section>

        {/* ─── Operational counts ─── */}
        <section
          aria-label="Operational counts"
          className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
        >
          <StatCard label="Pending orders" value={ordersPending} href="/admin/orders?status=PENDING" />
          <StatCard label="Unfulfilled" value={ordersUnfulfilled} href="/admin/orders?status=PAID" emphasis />
          <StatCard label="Shipped" value={ordersShipped} href="/admin/orders?status=SHIPPED" />
          <StatCard label="Available units" value={inventoryAvailable} href="/admin/inventory?status=AVAILABLE" />
          <StatCard label="Reserved units" value={inventoryReserved} href="/admin/inventory?status=RESERVED" />
          <StatCard label="Active products" value={productsActive} />
        </section>

        {/* ─── Recent orders + low stock ─── */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <div className="mb-4 flex items-baseline justify-between border-b border-limestone-deep/60 pb-3">
              <h2 className="font-serif text-title text-ink">Recent orders</h2>
              <Link
                href="/admin/orders"
                className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
              >
                All orders →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-caption text-ink-muted">
                No orders yet. The first real order will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-limestone-deep/40 border-y border-limestone-deep/40 bg-parchment">
                {recentOrders.map((o) => (
                  <li
                    key={o.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] items-baseline gap-4 px-4 py-3 text-caption"
                  >
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-ink underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                    >
                      {o.orderNumber}
                    </Link>
                    <span className="truncate text-ink-soft">
                      {o.email || '-'}
                    </span>
                    <StatusPill kind="order" value={o.status} />
                    <span className="tabular-nums text-ink">
                      <Price cents={o.totalCents} currency={o.currency} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-baseline justify-between border-b border-limestone-deep/60 pb-3">
              <h2 className="font-serif text-title text-ink">Sold out · needs attention</h2>
              <Link
                href="/admin/inventory"
                className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
              >
                Inventory →
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-caption text-ink-muted">
                Every active product has at least one available unit.
              </p>
            ) : (
              <ul className="divide-y divide-limestone-deep/40 border-y border-limestone-deep/40 bg-parchment">
                {lowStock.map((p) => (
                  <li key={p.id} className="px-4 py-3 text-caption">
                    <Link
                      href={`/products/${p.slug}`}
                      className="text-ink underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-caption text-ink-muted">
                      {p.era.replace('_', ' ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

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

function RevenueStat({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="relative overflow-hidden border border-greek-terracotta/30 bg-parchment px-6 py-5">
      {/* Sun-gold ambient — heritage glow on revenue. Kept at low
          opacity so the number reads first. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-sun-gold)_18%,transparent)_0%,transparent_60%)]"
      />
      <p className="relative text-eyebrow text-greek-terracotta-deep">{label}</p>
      <p className="relative mt-4 font-serif text-display text-sun-gold tabular-nums">
        <Price cents={cents} />
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  emphasis,
}: {
  label: string
  value: number
  href?: string
  emphasis?: boolean
}) {
  const inner = (
    <div
      className={`border border-greek-terracotta/20 bg-parchment px-5 py-4 transition-colors ${
        href ? 'hover:border-greek-teal' : ''
      }`}
    >
      <p className="text-eyebrow text-ink-muted">{label}</p>
      <p
        className={`mt-3 font-serif text-heading tabular-nums ${
          emphasis && value > 0 ? 'text-cedar-deep' : 'text-ink'
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
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
