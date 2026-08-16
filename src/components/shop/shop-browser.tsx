'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ShopProductCard } from './shop-product-card'
import { cn } from '@/lib/cn'
import {
  EMPTY_FILTERS,
  FACET_KEYS,
  FACET_LABELS,
  deriveFacets,
  facetOptions,
  filtersToQuery,
  hasActiveFilters,
  matchesFilters,
  priceBandLabel,
  sortProducts,
  toggleFacet,
  type FacetKey,
  type ShopFilters,
  type SortKey,
} from '@/lib/shopify/facets'
import type { ShopifyProduct } from '@/lib/shopify/types'
import type { ImageTileData } from '@/lib/image-bg'

/**
 * Merchandising shell for the shop grid.
 *
 * The server hands it the full ranked catalog plus the filter state parsed
 * from the URL, so the *initial* render already reflects `?category=Rings`
 * in the SSR HTML — deep links and crawlers see the filtered set, not the
 * whole case. After hydration every refinement is applied in memory against
 * that same list (instant, no refetch) and mirrored back to the address bar
 * with `history.replaceState`, so a filtered view can be copied, bookmarked,
 * and shared without a server round-trip per click.
 *
 * Hierarchy: in the unfiltered Featured order the first two pieces lead at
 * double width as statement anchors. Once the shopper is refining, the answer
 * to their query is the hierarchy, so the grid stays even.
 */

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-desc', label: 'Price · high' },
  { key: 'price-asc', label: 'Price · low' },
]

/** Groups shown inside the refine panel; category keeps its own tab row. */
const REFINE_KEYS: FacetKey[] = ['metal', 'karat', 'stone', 'price']

export function ShopBrowser({
  products,
  imageTiles,
  initialFilters,
}: {
  products: ShopifyProduct[]
  /** Sampled tile data (bg color + subject bounds) per featured-image URL. */
  imageTiles?: Record<string, ImageTileData>
  /** Filter state parsed from the URL on the server. */
  initialFilters?: ShopFilters
}) {
  const [filters, setFilters] = useState<ShopFilters>(
    initialFilters ?? EMPTY_FILTERS,
  )
  // The text input is uncontrolled by the URL so typing never lags; `filters.q`
  // follows it and drives the actual filtering.
  const [query, setQuery] = useState(initialFilters?.q ?? '')
  const [refineOpen, setRefineOpen] = useState(
    () => initialFilters ? REFINE_KEYS.some((k) => initialFilters[k].length > 0) : false,
  )
  const panelId = useId()
  const searchId = useId()

  // Tag every product once; the derivation walks each tag list and is pure.
  const entries = useMemo(
    () => products.map((product) => ({ product, facets: deriveFacets(product) })),
    [products],
  )

  const active = hasActiveFilters(filters)

  const view = useMemo(() => {
    const kept = entries
      .filter((e) => matchesFilters(e.facets, filters))
      .map((e) => e.product)
    return sortProducts(kept, filters.sort)
  }, [entries, filters])

  const groups = useMemo(
    () =>
      FACET_KEYS.map((key) => ({
        key,
        options: facetOptions(entries, filters, key),
      })),
    [entries, filters],
  )
  const categoryOptions =
    groups.find((g) => g.key === 'category')?.options ?? []

  // Mirror state to the URL, debounced so a burst of typing writes once.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const t = setTimeout(() => {
      const qs = filtersToQuery(filters)
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      // replaceState, not push: refining shouldn't bury the previous page
      // under a stack of filter states in the back button.
      window.history.replaceState(null, '', url)
    }, 250)
    return () => clearTimeout(t)
  }, [filters])

  // Fold the debounced search text into the filter state.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => (prev.q === query.trim() ? prev : { ...prev, q: query.trim() }))
    }, 180)
    return () => clearTimeout(t)
  }, [query])

  function toggle(key: FacetKey, value: string) {
    setFilters((prev) => toggleFacet(prev, key, value))
  }

  function clearAll() {
    setQuery('')
    setFilters((prev) => ({ ...EMPTY_FILTERS, sort: prev.sort }))
  }

  const refineCount = REFINE_KEYS.reduce((n, k) => n + filters[k].length, 0)

  const lead = !active && filters.sort === 'featured' ? view.slice(0, 2) : []
  const rest = lead.length > 0 ? view.slice(2) : view

  return (
    <div>
      {/* Search + sort */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-sm">
          <label htmlFor={searchId} className="text-eyebrow text-ink-muted">
            Search the case
          </label>
          <div className="relative mt-3">
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Emerald, hoops, size 6½…"
              autoComplete="off"
              className="h-11 w-full border-b border-limestone-deep bg-transparent pr-8 font-serif text-subtitle text-ink placeholder:text-ink-muted/70 focus:border-bronze focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-0 top-1/2 -translate-y-1/2 px-1 text-caption text-ink-muted transition-colors hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-x-4">
          <span className="text-eyebrow text-ink-muted">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, sort: s.key }))}
              aria-pressed={filters.sort === s.key ? 'true' : 'false'}
              className={cn(
                'text-caption tracking-wide transition-colors duration-300',
                filters.sort === s.key ? 'text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs + refine disclosure */}
      <div className="mt-8 flex flex-col gap-5 border-b border-limestone-deep/60 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <Tab
            active={filters.category.length === 0}
            onClick={() => setFilters((prev) => ({ ...prev, category: [] }))}
            label="All"
            count={
              // "All" means every piece still passing the non-category filters.
              entries.filter((e) =>
                matchesFilters(e.facets, { ...filters, category: [] }),
              ).length
            }
          />
          {categoryOptions.map((c) => (
            <Tab
              key={c.value}
              active={filters.category.includes(c.value)}
              onClick={() => toggle('category', c.value)}
              label={c.value}
              count={c.count}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRefineOpen((o) => !o)}
          aria-expanded={refineOpen}
          aria-controls={panelId}
          className="self-start text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors hover:text-olive hover:decoration-olive md:self-auto"
        >
          {refineOpen ? 'Hide refinements' : 'Refine'}
          {refineCount > 0 && ` (${refineCount})`}
        </button>
      </div>

      {/* Refine panel */}
      <div id={panelId} hidden={!refineOpen}>
        <div className="grid gap-x-10 gap-y-8 border-b border-limestone-deep/60 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups
            .filter((g) => REFINE_KEYS.includes(g.key))
            .map((group) => (
              <fieldset key={group.key}>
                <legend className="text-eyebrow text-ink-muted">
                  {FACET_LABELS[group.key]}
                </legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const on = filters[group.key].includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggle(group.key, opt.value)}
                        aria-pressed={on}
                        disabled={opt.count === 0 && !on}
                        className={cn(
                          'inline-flex items-baseline gap-1.5 border px-3 py-1.5 text-caption transition-colors duration-300',
                          on
                            ? 'border-ink bg-ink text-parchment'
                            : 'border-limestone-deep bg-parchment text-ink-soft hover:border-olive hover:text-olive',
                          opt.count === 0 && !on && 'cursor-not-allowed opacity-40 hover:border-limestone-deep hover:text-ink-soft',
                          'focus-visible:outline-2 focus-visible:outline-bronze',
                        )}
                      >
                        <span>{opt.label}</span>
                        <span
                          className={cn(
                            'tabular-nums text-[0.85em]',
                            on ? 'text-parchment/70' : 'text-ink-muted',
                          )}
                        >
                          {opt.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
        </div>
      </div>

      {/* Result line + active chips */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p role="status" className="text-eyebrow text-ink-muted">
          {view.length === products.length
            ? `${products.length} pieces`
            : `${view.length} of ${products.length} ${view.length === 1 ? 'piece' : 'pieces'}`}
        </p>
        {active && (
          <div className="flex flex-wrap items-center gap-2">
            {FACET_KEYS.flatMap((key) =>
              filters[key].map((value) => (
                <Chip
                  key={`${key}:${value}`}
                  label={key === 'price' ? priceBandLabel(value) : value}
                  onRemove={() => toggle(key, value)}
                />
              )),
            )}
            {filters.q && (
              <Chip label={`“${filters.q}”`} onRemove={() => setQuery('')} />
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors hover:text-olive hover:decoration-olive"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Statement lead */}
      {lead.length > 0 && (
        <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
          {lead.map((p) => (
            <li key={p.id}>
              <ShopProductCard
                product={p}
                featured
                imageTile={p.featuredImage ? imageTiles?.[p.featuredImage.url] : undefined}
              />
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
              <ShopProductCard
                product={p}
                imageTile={p.featuredImage ? imageTiles?.[p.featuredImage.url] : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {view.length === 0 && (
        <div className="mt-16">
          <p className="max-w-prose text-body leading-relaxed text-ink-soft">
            Nothing in the case matches that combination right now. Loosen a
            refinement, or write the concierge and we&apos;ll source it.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={clearAll}
              className="text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors hover:text-olive hover:decoration-olive"
            >
              Clear all filters
            </button>
            <a
              href="/contact"
              className="text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors hover:text-olive hover:decoration-olive"
            >
              Contact concierge →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group inline-flex items-center gap-2 border border-limestone-deep bg-parchment px-3 py-1.5 text-caption text-ink-soft transition-colors hover:border-olive hover:text-olive focus-visible:outline-2 focus-visible:outline-bronze"
    >
      <span>{label}</span>
      <span aria-hidden className="text-ink-muted transition-colors group-hover:text-olive">
        ✕
      </span>
      <span className="sr-only">Remove filter</span>
    </button>
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
          active ? 'border-bronze' : 'border-transparent group-hover:border-bronze/40',
        )}
      >
        {label}
      </span>
      <span className="text-caption tabular-nums text-ink-muted">{count}</span>
    </button>
  )
}
