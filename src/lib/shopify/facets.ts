import type { ShopifyProduct } from './types'
import { moneyToCents } from './money'

/**
 * Facet derivation for /shop.
 *
 * The catalog's Shopify tags are a flat, human-maintained list — the same
 * dimension shows up in several spellings ("Diamond" / "Diamonds"), several
 * stones share one tag ("Diamond & Emerald"), and the category is duplicated
 * from `productType`. This module is the single place that normalizes that
 * vocabulary into the four dimensions a shopper actually browses by, so the
 * shop filters and the PDP tag links always agree.
 *
 * Category comes from `productType` (authoritative — its counts match the
 * category tags exactly), never from tags.
 */

export const FACET_KEYS = ['category', 'metal', 'karat', 'stone', 'price'] as const
export type FacetKey = (typeof FACET_KEYS)[number]

/** Tags that restate `productType`; never surfaced as their own facet. */
const CATEGORY_TAGS = new Set([
  'necklaces',
  'earrings',
  'rings',
  'pendants',
  'bracelets',
])

/**
 * Metal tags are mutually exclusive in the catalog (verified: zero products
 * carry both "Gold" and "White Gold"), so the bare "Gold" tag is the yellow
 * bucket. Two-tone pieces resolve into both of their metals.
 */
const METAL_CANON: Record<string, string[]> = {
  gold: ['Yellow Gold'],
  'yellow gold': ['Yellow Gold'],
  'white gold': ['White Gold'],
  'rose gold': ['Rose Gold'],
  platinum: ['Platinum'],
  'white & yellow': ['White Gold', 'Yellow Gold'],
}

/** Display order for metals; anything unmapped sorts after these, by count. */
const METAL_ORDER = ['Yellow Gold', 'White Gold', 'Rose Gold', 'Platinum']

/**
 * Stone keywords, longest-first so "mother of pearl" wins over "pearl" and
 * "yellow sapphire" never strands on a bare substring match. Composite tags
 * ("Diamond & Emerald", "Pinkish/Purple Sapphires") are matched by scanning
 * for every keyword present, so one tag can feed several facets.
 *
 * "Citrin" is a known catalog misspelling of citrine — mapped rather than
 * corrected here so the filter works today; the underlying tag and product
 * title still need fixing in Shopify.
 */
const STONE_KEYWORDS: Array<[string, string]> = [
  ['mother of pearl', 'Mother of Pearl'],
  ['aquamarine', 'Aquamarine'],
  ['tourmaline', 'Tourmaline'],
  ['tanzanite', 'Tanzanite'],
  ['turquoise', 'Turquoise'],
  ['malachite', 'Malachite'],
  ['amethyst', 'Amethyst'],
  ['sapphire', 'Sapphire'],
  ['diamond', 'Diamond'],
  ['emerald', 'Emerald'],
  ['citrine', 'Citrine'],
  ['citrin', 'Citrine'],
  ['garnet', 'Garnet'],
  ['pearl', 'Pearl'],
  ['opal', 'Opal'],
  ['onyx', 'Onyx'],
  ['ruby', 'Ruby'],
  ['jade', 'Jade'],
  ['mop', 'Mother of Pearl'],
]

/** Stones a shopper is most likely to browse by, in house order. */
const STONE_ORDER = [
  'Diamond',
  'Emerald',
  'Sapphire',
  'Ruby',
  'Tourmaline',
  'Aquamarine',
  'Amethyst',
  'Opal',
  'Pearl',
  'Mother of Pearl',
]

export interface PriceBand {
  /** URL token, e.g. "1500-2500" or "5000-". */
  id: string
  label: string
  /** Inclusive lower bound, in cents. */
  minCents: number
  /** Exclusive upper bound, in cents; null means open-ended. */
  maxCents: number | null
}

/**
 * Bands chosen against the live price distribution (min $750, median $1,600,
 * max $25,450) so no band swallows the catalog and the top band isolates the
 * statement pieces.
 */
export const PRICE_BANDS: PriceBand[] = [
  { id: '0-1500', label: 'Under $1,500', minCents: 0, maxCents: 150000 },
  { id: '1500-2500', label: '$1,500 – $2,500', minCents: 150000, maxCents: 250000 },
  { id: '2500-5000', label: '$2,500 – $5,000', minCents: 250000, maxCents: 500000 },
  { id: '5000-', label: '$5,000 and above', minCents: 500000, maxCents: null },
]

export interface ProductFacets {
  category: string
  metals: string[]
  karats: string[]
  stones: string[]
  priceBand: string | null
  /** Lowercased title + type + tags + description, for substring search. */
  haystack: string
}

function normalizeKarat(tag: string): string | null {
  const m = /^(\d{1,2})\s*k$/i.exec(tag.trim())
  return m ? `${m[1]}K` : null
}

function stonesFromTag(tag: string): string[] {
  const lower = tag.toLowerCase()
  const found: string[] = []
  let remaining = lower
  for (const [needle, canon] of STONE_KEYWORDS) {
    if (remaining.includes(needle)) {
      if (!found.includes(canon)) found.push(canon)
      // Blank the match so "mother of pearl" doesn't also register "pearl".
      remaining = remaining.split(needle).join(' ')
    }
  }
  return found
}

/** Normalize one product's tags into the browsable dimensions. */
export function deriveFacets(product: ShopifyProduct): ProductFacets {
  const metals: string[] = []
  const karats: string[] = []
  const stones: string[] = []

  for (const rawTag of product.tags) {
    const tag = rawTag.trim()
    if (!tag) continue
    const lower = tag.toLowerCase()

    if (CATEGORY_TAGS.has(lower)) continue

    const karat = normalizeKarat(tag)
    if (karat) {
      if (!karats.includes(karat)) karats.push(karat)
      continue
    }

    const metal = METAL_CANON[lower]
    if (metal) {
      for (const m of metal) if (!metals.includes(m)) metals.push(m)
      continue
    }

    for (const s of stonesFromTag(tag)) {
      if (!stones.includes(s)) stones.push(s)
    }
  }

  const cents = moneyToCents(product.priceRange.minVariantPrice)
  const band = PRICE_BANDS.find(
    (b) => cents >= b.minCents && (b.maxCents === null || cents < b.maxCents),
  )

  const haystack = [
    product.title,
    product.productType,
    product.vendor,
    product.tags.join(' '),
    product.description ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return {
    category: (product.productType || '').trim(),
    metals,
    karats,
    stones,
    priceBand: band?.id ?? null,
    haystack,
  }
}

/** Active filter state, mirrored to and from the URL query string. */
export interface ShopFilters {
  q: string
  category: string[]
  metal: string[]
  karat: string[]
  stone: string[]
  price: string[]
  sort: SortKey
}

export type SortKey = 'featured' | 'price-desc' | 'price-asc'

export const SORT_KEYS: SortKey[] = ['featured', 'price-desc', 'price-asc']

export const EMPTY_FILTERS: ShopFilters = {
  q: '',
  category: [],
  metal: [],
  karat: [],
  stone: [],
  price: [],
  sort: 'featured',
}

function splitParam(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  const raw = Array.isArray(value) ? value : [value]
  return raw
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean)
}

/**
 * Parse filters out of a Next `searchParams` object. Unknown values are kept
 * verbatim — they simply match nothing — so a stale or hand-edited link
 * degrades to an empty result rather than a crash.
 */
export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ShopFilters {
  const sortRaw = Array.isArray(searchParams.sort)
    ? searchParams.sort[0]
    : searchParams.sort
  const sort = SORT_KEYS.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : 'featured'
  const qRaw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q

  return {
    q: (qRaw ?? '').trim().slice(0, 80),
    category: splitParam(searchParams.category),
    metal: splitParam(searchParams.metal),
    karat: splitParam(searchParams.karat),
    stone: splitParam(searchParams.stone),
    price: splitParam(searchParams.price),
    sort,
  }
}

/** Serialize filters back to a query string (stable key order, no empties). */
export function filtersToQuery(filters: ShopFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  for (const key of FACET_KEYS) {
    const values = filters[key]
    if (values.length > 0) params.set(key, values.join(','))
  }
  if (filters.sort !== 'featured') params.set('sort', filters.sort)
  return params.toString()
}

export function hasActiveFilters(filters: ShopFilters): boolean {
  return (
    filters.q.length > 0 ||
    FACET_KEYS.some((key) => filters[key].length > 0)
  )
}

/** Toggle one value inside one facet group, returning new filter state. */
export function toggleFacet(
  filters: ShopFilters,
  key: FacetKey,
  value: string,
): ShopFilters {
  const current = filters[key]
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]
  return { ...filters, [key]: next }
}

/**
 * Match a product against the filters. Within a group the values are OR'd
 * (White Gold *or* Rose Gold); across groups they're AND'd (White Gold *and*
 * Diamond) — the convention shoppers expect from faceted navigation.
 * Search terms are AND'd so each extra word narrows.
 */
export function matchesFilters(
  facets: ProductFacets,
  filters: ShopFilters,
): boolean {
  if (filters.category.length > 0 && !filters.category.includes(facets.category)) {
    return false
  }
  if (
    filters.metal.length > 0 &&
    !filters.metal.some((m) => facets.metals.includes(m))
  ) {
    return false
  }
  if (
    filters.karat.length > 0 &&
    !filters.karat.some((k) => facets.karats.includes(k))
  ) {
    return false
  }
  if (
    filters.stone.length > 0 &&
    !filters.stone.some((s) => facets.stones.includes(s))
  ) {
    return false
  }
  if (
    filters.price.length > 0 &&
    (facets.priceBand === null || !filters.price.includes(facets.priceBand))
  ) {
    return false
  }
  if (filters.q) {
    const terms = filters.q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.every((t) => facets.haystack.includes(t))) return false
  }
  return true
}

/** Sort helper shared by the server's initial render and the client view. */
export function sortProducts(
  products: ShopifyProduct[],
  sort: SortKey,
): ShopifyProduct[] {
  if (sort === 'featured') return products
  const dir = sort === 'price-desc' ? -1 : 1
  return [...products].sort(
    (a, b) =>
      dir *
      (moneyToCents(a.priceRange.minVariantPrice) -
        moneyToCents(b.priceRange.minVariantPrice)),
  )
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

/**
 * Build the option list for one group, counted against the products that pass
 * *every other* group's filters. That keeps counts honest as a shopper
 * narrows, while never hiding the options inside the group they're editing
 * (so a chosen value can always be un-chosen).
 */
export function facetOptions(
  entries: Array<{ facets: ProductFacets }>,
  filters: ShopFilters,
  key: FacetKey,
): FacetOption[] {
  const isolated: ShopFilters = { ...filters, [key]: [] }
  const pool = entries.filter((e) => matchesFilters(e.facets, isolated))

  const counts = new Map<string, number>()
  const bump = (v: string) => counts.set(v, (counts.get(v) ?? 0) + 1)

  for (const { facets } of pool) {
    if (key === 'category') {
      if (facets.category) bump(facets.category)
    } else if (key === 'metal') {
      facets.metals.forEach(bump)
    } else if (key === 'karat') {
      facets.karats.forEach(bump)
    } else if (key === 'stone') {
      facets.stones.forEach(bump)
    } else if (facets.priceBand) {
      bump(facets.priceBand)
    }
  }

  // A value the shopper has already selected stays listed even at zero, so the
  // chip is always reachable to turn back off.
  for (const selected of filters[key]) {
    if (!counts.has(selected)) counts.set(selected, 0)
  }

  const options = [...counts.entries()].map(([value, count]) => ({
    value,
    label: key === 'price' ? priceBandLabel(value) : value,
    count,
  }))

  if (key === 'price') {
    const order = PRICE_BANDS.map((b) => b.id)
    return options.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value))
  }
  if (key === 'karat') {
    // Highest karat first — the way the trade reads it.
    return options.sort((a, b) => parseInt(b.value, 10) - parseInt(a.value, 10))
  }
  if (key === 'metal') return options.sort(byHouseOrder(METAL_ORDER))
  if (key === 'stone') return options.sort(byHouseOrder(STONE_ORDER))
  return options.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

function byHouseOrder(order: string[]) {
  return (a: FacetOption, b: FacetOption) => {
    const ai = order.indexOf(a.value)
    const bi = order.indexOf(b.value)
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    }
    return b.count - a.count || a.value.localeCompare(b.value)
  }
}

export function priceBandLabel(id: string): string {
  return PRICE_BANDS.find((b) => b.id === id)?.label ?? id
}

/** Human label for a facet group, used for headings and chip prefixes. */
export const FACET_LABELS: Record<FacetKey, string> = {
  category: 'Category',
  metal: 'Metal',
  karat: 'Karat',
  stone: 'Stone',
  price: 'Price',
}

export interface FacetLink {
  key: FacetKey
  value: string
  href: string
}

/**
 * The normalized dimensions of one product, as links into the matching
 * filtered shop view. This is what turns a PDP's flat tag list into a way
 * back out into the catalog — the raw Shopify tags stay hidden, so shoppers
 * never see "Diamonds" and "Diamond" as two different things.
 */
export function facetLinks(product: ShopifyProduct): FacetLink[] {
  const facets = deriveFacets(product)
  const links: FacetLink[] = []
  const push = (key: FacetKey, value: string) => {
    links.push({
      key,
      value,
      href: `/shop?${key}=${encodeURIComponent(value)}`,
    })
  }
  if (facets.category) push('category', facets.category)
  facets.metals.forEach((m) => push('metal', m))
  facets.karats.forEach((k) => push('karat', k))
  facets.stones.forEach((s) => push('stone', s))
  return links
}

/**
 * Short, human summary of the active filters — powers the page title and the
 * result line so a shared link describes itself.
 */
export function describeFilters(filters: ShopFilters): string {
  const parts: string[] = []
  for (const key of FACET_KEYS) {
    const values = filters[key]
    if (values.length === 0) continue
    const labels = key === 'price' ? values.map(priceBandLabel) : values
    parts.push(labels.join(' or '))
  }
  if (filters.q) parts.push(`“${filters.q}”`)
  return parts.join(' · ')
}
