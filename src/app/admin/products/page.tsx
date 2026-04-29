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
  ERA_LABELS,
  STATUS_LABELS,
  STOCK_MODE_LABELS,
} from '@/lib/products/eras'
import {
  PRODUCT_ERA_OPTIONS,
  PRODUCT_PAGE_SIZE,
  PRODUCT_STATUS_OPTIONS,
  parseProductsFilters,
  productsWhereFromFilters,
} from '@/lib/admin/query'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requireStaffOrAdmin()
  const sp = await searchParams
  const filters = parseProductsFilters(sp)
  const where = productsWhereFromFilters(filters)

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (filters.page - 1) * PRODUCT_PAGE_SIZE,
      take: PRODUCT_PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        era: true,
        status: true,
        stockMode: true,
        priceCents: true,
        currency: true,
        isFeatured: true,
        isNewArrival: true,
        isHidden: true,
        publishedAt: true,
        _count: {
          select: { inventoryItems: { where: { status: 'AVAILABLE' } } },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE))

  const flash = sp.created ? 'Product created.' : sp.saved ? 'Changes saved.' : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description={`${total.toLocaleString()} product${total === 1 ? '' : 's'} in the catalog.`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center bg-ink px-4 text-eyebrow text-parchment hover:bg-olive"
          >
            New product
          </Link>
        }
      />
      <AdminPageBody>
        {flash ? (
          <p role="status" className="mb-6 inline-block border-l border-olive bg-olive/10 py-3 pl-4 pr-6 text-caption text-olive-deep">
            {flash}
          </p>
        ) : null}

        <div className="border border-limestone-deep/60 bg-parchment">
          <AdminFilterBar basePath="/admin/products">
            <FilterText
              name="q"
              label="Search"
              placeholder="Title or slug"
              defaultValue={filters.q}
            />
            <FilterSelect
              name="status"
              label="Status"
              defaultValue={filters.status}
              options={PRODUCT_STATUS_OPTIONS}
            />
            <FilterSelect
              name="era"
              label="Era"
              defaultValue={filters.era}
              options={PRODUCT_ERA_OPTIONS}
            />
          </AdminFilterBar>

          <AdminTable className="border-0">
            <AdminTableHead>
              <tr>
                <Th>Title</Th>
                <Th>Era</Th>
                <Th>Status</Th>
                <Th>Stock</Th>
                <Th align="right">Avail.</Th>
                <Th align="right">Price</Th>
                <Th>Flags</Th>
                <Th>Published</Th>
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {products.length === 0 ? (
                <EmptyRow colSpan={8} message="No products match these filters." />
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-limestone-deep/20">
                    <Td>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-serif text-title text-ink underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                      >
                        {p.title}
                      </Link>
                      <div className="mt-0.5 font-mono text-caption text-ink-muted">
                        {p.slug}
                      </div>
                    </Td>
                    <Td className="text-ink-soft">
                      {ERA_LABELS[p.era] ?? p.era}
                    </Td>
                    <Td>
                      <StatusPill kind="order" value={p.status} />
                    </Td>
                    <Td className="text-caption text-ink-muted">
                      {STOCK_MODE_LABELS[p.stockMode] ?? p.stockMode}
                    </Td>
                    <Td align="right" className="tabular-nums text-ink-soft">
                      {p._count.inventoryItems}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      <Price cents={p.priceCents} currency={p.currency} />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {p.isFeatured && (
                          <span className="inline-block bg-greek-teal/10 px-1.5 py-0.5 text-eyebrow text-greek-teal-deep">
                            Featured
                          </span>
                        )}
                        {p.isNewArrival && (
                          <span className="inline-block bg-bronze/10 px-1.5 py-0.5 text-eyebrow text-bronze">
                            New
                          </span>
                        )}
                        {p.isHidden && (
                          <span className="inline-block bg-murex-purple/10 px-1.5 py-0.5 text-eyebrow text-murex-purple">
                            Hidden
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td className="text-caption text-ink-muted">
                      {p.publishedAt
                        ? p.publishedAt.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' })
                        : '—'}
                    </Td>
                  </tr>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </div>

        <Pagination
          basePath="/admin/products"
          searchParams={sp}
          currentPage={filters.page}
          totalPages={totalPages}
        />
      </AdminPageBody>
    </>
  )
}
