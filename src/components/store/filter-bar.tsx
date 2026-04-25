import Link from 'next/link'
import {
  FILTERABLE_METALS,
  FILTERABLE_STONES,
  SORT_OPTIONS,
  buildFilterHref,
  type CollectionFilters,
  type SortValue,
} from '@/lib/store/filters'
import { cn } from '@/lib/cn'

const METAL_LABELS: Record<(typeof FILTERABLE_METALS)[number], string> = {
  GOLD_YELLOW: 'Yellow Gold',
  GOLD_WHITE: 'White Gold',
  GOLD_ROSE: 'Rose Gold',
  PLATINUM: 'Platinum',
  STERLING_SILVER: 'Sterling',
}

const STONE_LABELS: Record<(typeof FILTERABLE_STONES)[number], string> = {
  DIAMOND: 'Diamond',
  SAPPHIRE: 'Sapphire',
  RUBY: 'Ruby',
  EMERALD: 'Emerald',
  PEARL: 'Pearl',
  OPAL: 'Opal',
}

interface FilterBarProps {
  basePath: string
  filters: CollectionFilters
}

/**
 * Server-rendered filter bar. Each option is a `<Link>` whose href is
 * the current URL with the relevant param toggled. No JS, no hydration
 * cost, fully crawlable. Active state is visually distinct.
 */
export function FilterBar({ basePath, filters }: FilterBarProps) {
  return (
    <section
      aria-label="Refine"
      className="border-y border-limestone-deep/60 bg-parchment-deep/40 py-6"
    >
      <div className="grid gap-y-6 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-x-12">
        <p className="text-eyebrow text-ink-muted">Refine</p>
        <div className="space-y-4">
          <FilterRow
            label="Metal"
            current={filters.metal ?? null}
            options={[
              { value: null, label: 'All' },
              ...FILTERABLE_METALS.map((m) => ({ value: m, label: METAL_LABELS[m] })),
            ]}
            onSelect={(value) => buildFilterHref(basePath, filters, { metal: value })}
          />
          <FilterRow
            label="Stone"
            current={filters.stone ?? null}
            options={[
              { value: null, label: 'All' },
              ...FILTERABLE_STONES.map((s) => ({ value: s, label: STONE_LABELS[s] })),
            ]}
            onSelect={(value) => buildFilterHref(basePath, filters, { stone: value })}
          />
          <FilterRow
            label="Show"
            current={filters.available ?? null}
            options={[
              { value: null, label: 'All pieces' },
              { value: 'in-stock', label: 'In stock' },
            ]}
            onSelect={(value) => buildFilterHref(basePath, filters, { available: value })}
          />
        </div>
        <SortSelect basePath={basePath} filters={filters} />
      </div>
    </section>
  )
}

function FilterRow({
  label,
  current,
  options,
  onSelect,
}: {
  label: string
  current: string | null
  options: Array<{ value: string | null; label: string }>
  onSelect: (value: string | null) => string
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <span className="min-w-[64px] text-eyebrow text-ink-muted">{label}</span>
      <ul className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        {options.map((opt) => {
          const isActive = (opt.value ?? null) === (current ?? null)
          return (
            <li key={opt.label}>
              <Link
                href={onSelect(opt.value)}
                className={cn(
                  'text-caption transition-colors duration-200',
                  isActive
                    ? 'text-ink underline underline-offset-4 decoration-bronze'
                    : 'text-ink-soft hover:text-olive',
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                {opt.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SortSelect({
  basePath,
  filters,
}: {
  basePath: string
  filters: CollectionFilters
}) {
  const current: SortValue = filters.sort ?? 'featured'
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 md:justify-end">
      <span className="text-eyebrow text-ink-muted">Sort</span>
      <ul className="flex flex-wrap items-baseline gap-x-3">
        {SORT_OPTIONS.map((opt) => {
          const isActive = opt.value === current
          return (
            <li key={opt.value}>
              <Link
                href={buildFilterHref(basePath, filters, { sort: opt.value === 'featured' ? null : opt.value })}
                className={cn(
                  'text-caption transition-colors duration-200',
                  isActive
                    ? 'text-ink underline underline-offset-4 decoration-bronze'
                    : 'text-ink-soft hover:text-olive',
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                {opt.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
