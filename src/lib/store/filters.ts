import { z } from 'zod'
import type { MaterialKind, Prisma, StoneKind } from '@prisma/client'

/**
 * URL-driven collection filters. Server reads `searchParams`, validates
 * with Zod, and converts to a Prisma where clause. Anything unrecognized
 * is dropped silently — the URL never controls what is queried beyond
 * the intended whitelist.
 */

export const FILTERABLE_METALS = [
  'GOLD_YELLOW',
  'GOLD_WHITE',
  'GOLD_ROSE',
  'PLATINUM',
  'STERLING_SILVER',
] as const satisfies readonly MaterialKind[]

export const FILTERABLE_STONES = [
  'DIAMOND',
  'SAPPHIRE',
  'RUBY',
  'EMERALD',
  'JADE',
  'PEARL',
  'OPAL',
] as const satisfies readonly StoneKind[]

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price · low to high' },
  { value: 'price-desc', label: 'Price · high to low' },
] as const

export type SortValue = (typeof SORT_OPTIONS)[number]['value']

const filtersSchema = z.object({
  metal: z.enum(FILTERABLE_METALS).optional(),
  stone: z.enum(FILTERABLE_STONES).optional(),
  available: z.literal('in-stock').optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc']).optional(),
})

export type CollectionFilters = z.infer<typeof filtersSchema>

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined | null,
): CollectionFilters {
  if (!searchParams) return {}
  const flat: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(searchParams)) {
    flat[k] = Array.isArray(v) ? v[0] : v
  }
  const result = filtersSchema.safeParse(flat)
  return result.success ? result.data : {}
}

/**
 * Build a Prisma `where` clause for products in a collection given the
 * parsed filters. Caller already constrains by collection membership.
 */
export function productWhereForFilters(
  filters: CollectionFilters,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    isHidden: false,
  }
  if (filters.metal) {
    where.materials = { some: { kind: filters.metal } }
  }
  if (filters.stone) {
    where.stones = { some: { kind: filters.stone } }
  }
  if (filters.available === 'in-stock') {
    where.inventoryItems = { some: { status: 'AVAILABLE' } }
  }
  return where
}

export function productOrderByForFilters(
  filters: CollectionFilters,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (filters.sort) {
    case 'newest':
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    case 'price-asc':
      return [{ priceCents: 'asc' }, { publishedAt: 'desc' }]
    case 'price-desc':
      return [{ priceCents: 'desc' }, { publishedAt: 'desc' }]
    case 'featured':
    default:
      return [{ isFeatured: 'desc' }, { publishedAt: 'desc' }]
  }
}

/**
 * Build a URL preserving the current filters, with one filter set to a
 * new value (or removed if the new value is `null`). Used by the filter
 * bar to build navigable links without a client component.
 */
export function buildFilterHref(
  basePath: string,
  current: CollectionFilters,
  patch: Partial<Record<keyof CollectionFilters, string | null>>,
): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(current)) {
    if (v) params.set(k, String(v))
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === '') {
      params.delete(k)
    } else {
      params.set(k, v)
    }
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}
