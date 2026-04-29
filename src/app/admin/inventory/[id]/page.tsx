import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  EmptyRow,
  Td,
  Th,
} from '@/components/admin/data-table'
import { StatusPill } from '@/components/admin/status-pill'
import { ERA_LABELS } from '@/lib/products/eras'
import {
  holdUnitAction,
  unholdUnitAction,
  releaseUnitAction,
  markDamagedUnitAction,
} from '../actions'

export const metadata: Metadata = { title: 'Inventory unit — Admin' }

const BANNERS: Record<string, { msg: string; tone: 'success' | 'error' }> = {
  created:  { msg: 'Inventory unit created.', tone: 'success' },
  held:     { msg: 'Unit placed on hold.', tone: 'success' },
  unheld:   { msg: 'Unit released back to available.', tone: 'success' },
  released: { msg: 'Reservation released.', tone: 'success' },
  damaged:  { msg: 'Unit marked as damaged.', tone: 'success' },
  state:    { msg: 'That action is not available from the unit’s current status.', tone: 'error' },
}

const EVENT_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  RESERVED: 'Reserved',
  RESERVATION_RELEASED: 'Reservation released',
  RESERVATION_EXPIRED: 'Reservation expired',
  SOLD: 'Sold',
  RETURNED: 'Returned',
  HELD: 'Placed on hold',
  HELD_RELEASED: 'Hold released',
  DAMAGED: 'Marked damaged',
  ADJUSTED: 'Adjusted',
}

function formatDateTime(d: Date) {
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default async function AdminInventoryUnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaffOrAdmin()
  const { id } = await params
  const sp = await searchParams
  const flashKey = Object.keys(BANNERS).find((k) => sp[k])

  const [unit, ledger] = await Promise.all([
    prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            era: true,
            status: true,
            priceCents: true,
            currency: true,
          },
        },
      },
    }),
    prisma.inventoryLedger.findMany({
      where: { inventoryItemId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        actor: { select: { email: true, name: true } },
      },
    }),
  ])

  if (!unit) notFound()

  const banner = flashKey ? BANNERS[flashKey] : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations · Inventory"
        title={unit.sku ?? `Unit ${unit.id.slice(-8)}`}
        description={unit.product.title}
        actions={
          <Link
            href="/admin/inventory"
            className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
          >
            ← All inventory
          </Link>
        }
      />
      <AdminPageBody>
        {banner ? (
          <p
            role={banner.tone === 'error' ? 'alert' : 'status'}
            className={`mb-6 inline-block border-l py-3 pl-4 pr-6 text-caption ${
              banner.tone === 'error'
                ? 'border-cedar-deep bg-cedar/10 text-cedar-deep'
                : 'border-olive bg-olive/10 text-olive-deep'
            }`}
          >
            {banner.msg}
          </p>
        ) : null}

        {/* ── Detail card ── */}
        <section className="border border-limestone-deep/60 bg-parchment p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <StatusPill kind="inventory" value={unit.status} />
              <p className="font-serif text-display text-ink">
                <Link
                  href={`/admin/products/${unit.product.id}`}
                  className="underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                >
                  {unit.product.title}
                </Link>
              </p>
              <p className="text-caption text-ink-muted">
                {ERA_LABELS[unit.product.era] ?? unit.product.era} · {unit.product.status}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {unit.status === 'AVAILABLE' && (
                <form action={holdUnitAction}>
                  <input type="hidden" name="id" value={unit.id} />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center border border-ink/30 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
                  >
                    Place on hold
                  </button>
                </form>
              )}
              {unit.status === 'HOLD' && (
                <form action={unholdUnitAction}>
                  <input type="hidden" name="id" value={unit.id} />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center border border-ink/30 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
                  >
                    Release hold
                  </button>
                </form>
              )}
              {unit.status === 'RESERVED' && (
                <form action={releaseUnitAction}>
                  <input type="hidden" name="id" value={unit.id} />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center border border-ink/30 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
                  >
                    Release reservation
                  </button>
                </form>
              )}
              {(unit.status === 'AVAILABLE' || unit.status === 'HOLD') && (
                <form action={markDamagedUnitAction}>
                  <input type="hidden" name="id" value={unit.id} />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center border border-cedar-deep/40 bg-cedar/10 px-3 text-eyebrow text-cedar-deep hover:border-cedar-deep"
                  >
                    Mark damaged
                  </button>
                </form>
              )}
            </div>
          </div>

          <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-eyebrow text-ink-muted">SKU</dt>
              <dd className="mt-2 font-mono text-body text-ink">{unit.sku ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-ink-muted">Internal ref</dt>
              <dd className="mt-2 font-mono text-body text-ink">{unit.internalRef ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-ink-muted">Cost</dt>
              <dd className="mt-2 tabular-nums text-body text-ink">
                {unit.costCents != null ? `$${(unit.costCents / 100).toFixed(2)}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow text-ink-muted">Created</dt>
              <dd className="mt-2 text-body text-ink-soft">{formatDateTime(unit.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-ink-muted">Sold at</dt>
              <dd className="mt-2 text-body text-ink-soft">
                {unit.soldAt ? formatDateTime(unit.soldAt) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow text-ink-muted">Reservation</dt>
              <dd className="mt-2 text-body text-ink-soft">
                {unit.reservedExpiresAt ? (
                  <>
                    <div>Expires {formatDateTime(unit.reservedExpiresAt)}</div>
                    {unit.reservedCartId ? (
                      <div className="mt-1 font-mono text-caption text-ink-muted">
                        cart {unit.reservedCartId.slice(0, 12)}…
                      </div>
                    ) : null}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* ── Ledger ── */}
        <section className="mt-12">
          <h2 className="font-serif text-heading text-ink">Ledger history</h2>
          <p className="mt-2 text-caption text-ink-muted">
            Every state change for this unit, newest first.
          </p>

          <AdminTable className="mt-6">
            <AdminTableHead>
              <tr>
                <Th>When</Th>
                <Th>Event</Th>
                <Th>From → To</Th>
                <Th>Actor</Th>
                <Th>Reason</Th>
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {ledger.length === 0 ? (
                <EmptyRow colSpan={5} message="No ledger entries yet." />
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-limestone-deep/20">
                    <Td className="text-caption text-ink-muted">
                      {formatDateTime(entry.createdAt)}
                    </Td>
                    <Td>
                      <span className="text-body text-ink">
                        {EVENT_LABELS[entry.event] ?? entry.event}
                      </span>
                    </Td>
                    <Td className="text-caption text-ink-muted">
                      {entry.fromStatus ?? '—'} → {entry.toStatus ?? '—'}
                    </Td>
                    <Td className="text-caption text-ink-soft">
                      {entry.actor ? (entry.actor.email ?? entry.actor.name ?? '—') : <span className="text-ink-muted">system</span>}
                    </Td>
                    <Td className="font-mono text-caption text-ink-muted">
                      {entry.reason ?? '—'}
                    </Td>
                  </tr>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </section>
      </AdminPageBody>
    </>
  )
}
