import Link from 'next/link'
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
import {
  AdminFilterBar,
  FilterSelect,
  FilterText,
} from '@/components/admin/filter-bar'
import { Pagination } from '@/components/admin/pagination'
import { StatusPill } from '@/components/admin/status-pill'
import { Price } from '@/components/store/price'
import {
  INVENTORY_PAGE_SIZE,
  INVENTORY_STATUS_OPTIONS,
  inventoryWhereFromFilters,
  parseInventoryFilters,
} from '@/lib/admin/query'
import {
  bulkHoldAction,
  bulkMarkDamagedAction,
  bulkReleaseAction,
  bulkUnholdAction,
} from './actions'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const BULK_BANNERS: Record<string, string> = {
  released: 'Reservations released to available.',
  held: 'Items placed on admin hold.',
  unheld: 'Items released back to available.',
  damaged: 'Items marked as damaged.',
}

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  await requireStaffOrAdmin()
  const sp = await searchParams
  const filters = parseInventoryFilters(sp)
  const where = inventoryWhereFromFilters(filters)

  const [items, total, statusCounts] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (filters.page - 1) * INVENTORY_PAGE_SIZE,
      take: INVENTORY_PAGE_SIZE,
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            era: true,
            priceCents: true,
            currency: true,
          },
        },
      },
    }),
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE))

  const countByStatus = new Map(
    statusCounts.map((s) => [s.status, s._count._all]),
  )

  const exportParams = new URLSearchParams()
  if (filters.status) exportParams.set('status', filters.status)
  if (filters.q) exportParams.set('q', filters.q)
  const exportHref = `/admin/export/inventory${
    exportParams.toString() ? `?${exportParams.toString()}` : ''
  }`

  const flashBanner = Object.entries(BULK_BANNERS).find(
    ([k]) => sp[k] && Number(sp[k]) > 0,
  )
  const errorMsg = sp.error === 'no_selection' ? 'Select at least one row.' : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Inventory"
        description="Per-piece inventory. Each row is one physical unit. Bulk actions operate on the rows you check."
        actions={
          <Link
            href={exportHref}
            className="inline-flex h-9 items-center border border-ink/30 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
          >
            Export CSV
          </Link>
        }
      />
      <AdminPageBody>
        {flashBanner ? (
          <p
            role="status"
            className="mb-6 inline-block border-l border-olive bg-olive/10 py-3 pl-4 pr-6 text-caption text-olive-deep"
          >
            {BULK_BANNERS[flashBanner[0]]} ({flashBanner[1]})
          </p>
        ) : null}
        {errorMsg ? (
          <p
            role="alert"
            className="mb-6 inline-block border-l border-cedar-deep bg-cedar/10 py-3 pl-4 pr-6 text-caption text-cedar-deep"
          >
            {errorMsg}
          </p>
        ) : null}

        <section className="mb-8 grid gap-3 sm:grid-cols-3 md:grid-cols-6">
          {INVENTORY_STATUS_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className="border border-limestone-deep/60 bg-parchment px-4 py-3"
            >
              <p className="text-eyebrow text-ink-muted">{opt.label}</p>
              <p className="mt-2 font-serif text-title text-ink tabular-nums">
                {(countByStatus.get(opt.value) ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </section>

        <div className="border border-limestone-deep/60 bg-parchment">
          <AdminFilterBar basePath="/admin/inventory">
            <FilterText
              name="q"
              label="Search"
              placeholder="SKU, ref, product name"
              defaultValue={filters.q}
            />
            <FilterSelect
              name="status"
              label="Status"
              defaultValue={filters.status}
              options={INVENTORY_STATUS_OPTIONS}
            />
          </AdminFilterBar>

          <form className="overflow-x-auto">
            <div className="flex flex-wrap items-center gap-2 border-b border-limestone-deep/60 px-4 py-3">
              <p className="text-eyebrow text-ink-muted">Bulk</p>
              <button
                type="submit"
                formAction={bulkReleaseAction}
                className="inline-flex h-8 items-center border border-ink/30 bg-parchment-warm/40 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
              >
                Release reservations
              </button>
              <button
                type="submit"
                formAction={bulkHoldAction}
                className="inline-flex h-8 items-center border border-ink/30 bg-parchment-warm/40 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
              >
                Place on hold
              </button>
              <button
                type="submit"
                formAction={bulkUnholdAction}
                className="inline-flex h-8 items-center border border-ink/30 bg-parchment-warm/40 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
              >
                Release hold
              </button>
              <button
                type="submit"
                formAction={bulkMarkDamagedAction}
                className="inline-flex h-8 items-center border border-cedar-deep/40 bg-cedar/10 px-3 text-eyebrow text-cedar-deep hover:border-cedar-deep hover:text-cedar-deep"
              >
                Mark damaged
              </button>
            </div>

            <AdminTable className="border-0">
              <AdminTableHead>
                <tr>
                  <Th className="w-10"> </Th>
                  <Th>SKU</Th>
                  <Th>Product</Th>
                  <Th>Status</Th>
                  <Th>Reserved</Th>
                  <Th align="right">Price</Th>
                </tr>
              </AdminTableHead>
              <AdminTableBody>
                {items.length === 0 ? (
                  <EmptyRow colSpan={6} message="No inventory rows match." />
                ) : (
                  items.map((i) => (
                    <tr key={i.id} className="hover:bg-limestone-deep/20">
                      <Td>
                        <input
                          type="checkbox"
                          name="id"
                          value={i.id}
                          className="h-4 w-4 border-limestone-deep text-olive focus-visible:ring-2 focus-visible:ring-bronze"
                        />
                      </Td>
                      <Td>
                        <span className="font-mono text-ink">{i.sku ?? '-'}</span>
                        {i.internalRef ? (
                          <div className="mt-1 text-caption text-ink-muted">
                            ref {i.internalRef}
                          </div>
                        ) : null}
                      </Td>
                      <Td>
                        <Link
                          href={`/products/${i.product.slug}`}
                          className="text-ink underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                        >
                          {i.product.title}
                        </Link>
                        <div className="mt-1 text-caption text-ink-muted">
                          {i.product.era.replace('_', ' ')}
                        </div>
                      </Td>
                      <Td>
                        <StatusPill kind="inventory" value={i.status} />
                      </Td>
                      <Td className="text-caption text-ink-muted">
                        {i.reservedExpiresAt ? (
                          <>
                            <span className="text-ink-soft">
                              {i.reservedExpiresAt.toLocaleString('en-US')}
                            </span>
                            <div className="text-caption text-ink-muted">
                              cart {i.reservedCartId?.slice(0, 8)}…
                            </div>
                          </>
                        ) : (
                          '-'
                        )}
                      </Td>
                      <Td align="right" className="tabular-nums">
                        <Price
                          cents={i.product.priceCents}
                          currency={i.product.currency}
                        />
                      </Td>
                    </tr>
                  ))
                )}
              </AdminTableBody>
            </AdminTable>
          </form>
        </div>

        <Pagination
          basePath="/admin/inventory"
          searchParams={sp}
          currentPage={filters.page}
          totalPages={totalPages}
        />
      </AdminPageBody>
    </>
  )
}
