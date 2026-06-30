'use client'

import { useMemo, useState } from 'react'
import { ShopProductCard } from './shop-product-card'
import { moneyToCents } from '@/lib/shopify/money'
import { cn } from '@/lib/cn'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Client-side merchandising shell for the shop grid. The server hands it a
 * already-ranked list (in-stock first, price descending), so the *initial*
 * render — All / Featured — is the full catalog in strategic order and ships
 * in the SSR HTML (crawlable, LCP-safe). Category + sort are progressive
 * enhancements that re-slice that same in-memory list; no refetch, no reload.
 *
 * Hierarchy: in Featured order the first two pieces lead at double width as
 * statement anchors, then the rest fall into the standard grid.
 */

type SortKey = 'featured' | 'price-desc' | 'price-asc'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-desc', label: 'Price · high' },
  { key: 'price-asc', label: 'Price · low' },
]

const ALL = 'All'

export function ShopBrowser({ products }: { products: ShopifyProduct[] }) {
  const [category, setCategory] = useState<string>(ALL)
  const [sort, setSort] = useState<SortKey>('featured')

  // Categories actually present, most-stocked first.
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      const c = (p.productType || '').trim()
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({ name, n }))
  }, [products])

  const view = useMemo(() => {
    const base =
      category === ALL
        ? products
        : products.filter((p) => (p.productType || '').trim() === category)
    if (sort === 'featured') return base // server rank: in-stock first, price desc
    const dir = sort === 'price-desc' ? -1 : 1
    return [...base].sort(
      (a, b) =>
        dir *
        (moneyToCents(a.priceRange.minVariantPrice) -
          moneyToCents(b.priceRange.minVariantPrice)),
    )
  }, [products, category, sort])

  // Statement lead only in Featured order — when the shopper picks an explicit
  // price sort, the order itself is the hierarchy, so keep one even grid.
  const lead = sort === 'featured' ? view.slice(0, 2) : []
  const rest = sort === 'featured' ? view.slice(2) : view

  return (
    <div>
      {/* Filter + sort bar */}
      <div className="flex flex-col gap-5 border-b border-limestone-deep/60 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <Tab
            active={category === ALL}
            onClick={() => setCategory(ALL)}
            label="All"
            count={products.length}
          />
          {categories.map((c) => (
            <Tab
              key={c.name}
              active={category === c.name}
              onClick={() => setCategory(c.name)}
              label={c.name}
              count={c.n}
            />
          ))}
        </div>
        <div className="flex items-center gap-x-4">
          <span className="text-eyebrow text-ink-muted">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              aria-pressed={sort === s.key ? 'true' : 'false'}
              className={cn(
                'text-caption tracking-wide transition-colors duration-300',
                sort === s.key
                  ? 'text-ink'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statement lead */}
      {lead.length > 0 && (
        <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
          {lead.map((p) => (
            <li key={p.id}>
              <ShopProductCard product={p} featured />
            </li>
          ))}
        </ul>
      )}

      {/* Standard grid */}
      {rest.length > 0 && (
        <ul
          className={cn(
            'grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            lead.length > 0 ? 'mt-16' : 'mt-12',
          )}
        >
          {rest.map((p) => (
            <li key={p.id}>
              <ShopProductCard product={p} />
            </li>
          ))}
        </ul>
      )}

      {view.length === 0 && (
        <p className="mt-16 text-body leading-relaxed text-ink-soft">
          Nothing in this category right now — try another, or write the
          concierge and we&apos;ll source it.
        </p>
      )}
    </div>
  )
}

function Tab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ? 'true' : 'false'}
      className={cn(
        'group inline-flex items-baseline gap-1.5 font-serif text-subtitle transition-colors duration-300',
        active ? 'text-ink' : 'text-ink-muted hover:text-ink',
      )}
    >
      <span
        className={cn(
          'border-b pb-1 transition-colors duration-300',
          active
            ? 'border-bronze'
            : 'border-transparent group-hover:border-bronze/40',
        )}
      >
        {label}
      </span>
      <span className="text-caption tabular-nums text-ink-muted">{count}</span>
    </button>
  )
}
