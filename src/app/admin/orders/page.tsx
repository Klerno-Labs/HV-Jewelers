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
  FilterDate,
  FilterSelect,
  FilterText,
} from '@/components/admin/filter-bar'
import { Pagination } from '@/components/admin/pagination'
import { StatusPill } from '@/components/admin/status-pill'
import { Price } from '@/components/store/price'
import {
  ORDER_PAGE_SIZE,
  ORDER_STATUS_OPTIONS,
  ordersWhereFromFilters,
  parseOrdersFilters,
} from '@/lib/admin/query'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireStaffOrAdmin()
  const sp = await searchParams
  const filters = parseOrdersFilters(sp)
  const where = ordersWhereFromFilters(filters)

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * ORDER_PAGE_SIZE,
      take: ORDER_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        totalCents: true,
        currency: true,
        shipCity: true,
        shipRegion: true,
        createdAt: true,
        _count: { select: { lines: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE))

  // Build the export URL preserving current filters
  const exportParams = new URLSearchParams()
  if (filters.status) exportParams.set('status', filters.status)
  if (filters.q) exportParams.set('q', filters.q)
  if (filters.from) exportParams.set('from', filters.from.toISOString().slice(0, 10))
  if (filters.to) exportParams.set('to', filters.to.toISOString().slice(0, 10))
  const exportHref = `/admin/export/orders${
    exportParams.toString() ? `?${exportParams.toString()}` : ''
  }`

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Orders"
        description={`${total.toLocaleString()} order${total === 1 ? '' : 's'} on record.`}
      />
      <AdminPageBody>
        <div className="border border-limestone-deep/60 bg-parchment">
          <AdminFilterBar
            basePath="/admin/orders"
            actions={
              <Link
                href={exportHref}
                className="inline-flex h-9 items-center border border-ink/30 px-3 text-eyebrow text-ink-soft hover:border-olive hover:text-olive"
              >
                Export CSV
              </Link>
            }
          >
            <FilterText
              name="q"
              label="Search"
              placeholder="Order # or email"
              defaultValue={filters.q}
            />
            <FilterSelect
              name="status"
              label="Status"
              defaultValue={filters.status}
              options={ORDER_STATUS_OPTIONS}
            />
            <FilterDate
              name="from"
              label="From"
              defaultValue={filters.from?.toISOString().slice(0, 10)}
            />
            <FilterDate
              name="to"
              label="To"
              defaultValue={filters.to?.toISOString().slice(0, 10)}
            />
          </AdminFilterBar>

          <AdminTable className="border-0">
            <AdminTableHead>
              <tr>
                <Th>Order</Th>
                <Th>Placed</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Fulfillment</Th>
                <Th align="right">Lines</Th>
                <Th align="right">Total</Th>
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {orders.length === 0 ? (
                <EmptyRow colSpan={7} message="No orders match these filters." />
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-limestone-deep/20">
                    <Td>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-ink underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                      >
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td className="text-ink-soft">
                      {o.createdAt.toLocaleDateString('en-US', {
                        year: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Td>
                    <Td className="text-ink-soft">
                      <div>{o.email || '-'}</div>
                      {o.shipCity ? (
                        <div className="text-caption text-ink-muted">
                          {o.shipCity}, {o.shipRegion}
                        </div>
                      ) : null}
                    </Td>
                    <Td>
                      <StatusPill kind="order" value={o.status} />
                    </Td>
                    <Td>
                      <StatusPill kind="fulfillment" value={o.fulfillmentStatus} />
                    </Td>
                    <Td align="right" className="text-ink-soft tabular-nums">
                      {o._count.lines}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      <Price cents={o.totalCents} currency={o.currency} />
                    </Td>
                  </tr>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </div>

        <Pagination
          basePath="/admin/orders"
          searchParams={sp}
          currentPage={filters.page}
          totalPages={totalPages}
        />
      </AdminPageBody>
    </>
  )
}
