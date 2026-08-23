import {
  EMPTY_FILTERS,
  PRICE_BANDS,
  type ShopFilters,
  deriveFacets,
  matchesFilters,
} from './facets'
import type { ShopifyProduct } from './types'

/**
 * Named collection pages: /collections/emerald-necklaces and friends.
 *
 * These exist for three reasons the query-string shop filters cannot serve:
 *
 * 1. **Search engines.** Every `?facet=` view canonicalizes back to /shop, so
 *    the store has no indexable page for "emerald necklace" or any other
 *    query people actually type. A path-based collection is a real page.
 * 2. **Pinterest scheduling.** The publisher's spam-spacing rule compares
 *    destination host + path with the query string stripped, so every
 *    filtered link counts as /shop — one pin slot per 72 hours for the whole
 *    store. Distinct paths are distinct slots.
 * 3. **Durable pin destinations.** Every piece is quantity one, so a pin at a
 *    product URL points at a page that dies when the piece sells. A
 *    collection restocks underneath the pin instead.
 *
 * Definitions are derived from the live catalog, never hand-listed: a
 * collection only exists while at least MIN_PIECES available pieces match it,
 * and its facet values are the values `deriveFacets` actually emitted — so a
 * collection can never name a stone or metal the catalog does not carry.
 */

export interface CollectionDef {
  slug: string
  title: string
  /** Used for the meta description and the page intro. Factual only. */
  description: string
  filters: ShopFilters
  count: number
}

/** Below this a "collection" is just one product wearing a heading. */
const MIN_PIECES = 2

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const withFilters = (partial: Partial<ShopFilters>): ShopFilters => ({
  ...EMPTY_FILTERS,
  ...partial,
})

/**
 * Build every collection the current catalog supports. Deterministic for a
 * given product list, so the sitemap, the shop page links, and
 * generateStaticParams always agree with each other.
 */
export function buildCollections(products: ShopifyProduct[]): CollectionDef[] {
  const stocked = products
    .filter((p) => p.availableForSale)
    .map((p) => ({ p, f: deriveFacets(p) }))

  const defs: CollectionDef[] = []
  const seen = new Set<string>()

  const add = (
    slug: string,
    title: string,
    describe: (n: number) => string,
    filters: ShopFilters,
  ): void => {
    if (!slug || seen.has(slug)) return
    const count = stocked.filter(({ f }) => matchesFilters(f, filters)).length
    if (count < MIN_PIECES) return
    seen.add(slug)
    defs.push({ slug, title, description: describe(count), filters, count })
  }

  const uniq = <T,>(values: T[]): T[] => [...new Set(values)]
  const categories = uniq(stocked.map(({ f }) => f.category)).filter(Boolean)
  const stones = uniq(stocked.flatMap(({ f }) => f.stones))
  const metals = uniq(stocked.flatMap(({ f }) => f.metals))

  // Categories: /collections/necklaces
  for (const category of categories) {
    add(
      slugify(category),
      category,
      (n) => `${n} one-of-a-kind ${category.toLowerCase()} currently in the case at HV Jewelers.`,
      withFilters({ category: [category] }),
    )
  }

  // Stone × category: /collections/emerald-necklaces — the query shape
  // people actually search. Mother of Pearl is skipped as a lead: it is an
  // inlay material, and "Mother of Pearl Necklaces" is not a search anyone
  // performs, while its presence would dilute the real pearl collection.
  for (const stone of stones) {
    if (stone === 'Mother of Pearl') continue
    for (const category of categories) {
      add(
        slugify(`${stone} ${category}`),
        `${stone} ${category}`,
        (n) =>
          `${n} ${stone.toLowerCase()} ${category.toLowerCase()}, each a single piece, photographed in house.`,
        withFilters({ stone: [stone], category: [category] }),
      )
    }
    add(
      slugify(`${stone} jewelry`),
      `${stone} Jewelry`,
      (n) => `${n} pieces featuring ${stone.toLowerCase()}, one of each, currently available.`,
      withFilters({ stone: [stone] }),
    )
  }

  // Metal × category: /collections/yellow-gold-bracelets
  for (const metal of metals) {
    for (const category of categories) {
      add(
        slugify(`${metal} ${category}`),
        `${metal} ${category}`,
        (n) =>
          `${n} ${metal.toLowerCase()} ${category.toLowerCase()} in the case now, one piece per design.`,
        withFilters({ metal: [metal], category: [category] }),
      )
    }
  }

  // Gifts by budget, aligned to the shop's own price bands so the page shows
  // exactly what the heading promises.
  const bandIds = PRICE_BANDS.map((b) => b.id)
  add(
    'gifts-under-1500',
    'Gifts Under $1,500',
    (n) => `${n} one-of-a-kind pieces under $1,500, ready to gift.`,
    withFilters({ price: bandIds.slice(0, 1) }),
  )
  add(
    'gifts-under-2500',
    'Gifts Under $2,500',
    (n) => `${n} one-of-a-kind pieces under $2,500, ready to gift.`,
    withFilters({ price: bandIds.slice(0, 2) }),
  )

  return defs
}

export function findCollection(
  products: ShopifyProduct[],
  slug: string,
): CollectionDef | null {
  return buildCollections(products).find((c) => c.slug === slug) ?? null
}
