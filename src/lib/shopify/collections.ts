import {
  EMPTY_FILTERS,
  PRICE_BANDS,
  type ShopFilters,
  deriveFacets,
  matchesFilters,
} from './facets'
import type { ShopifyProduct } from './types'

export interface CollectionDef {
  slug: string
  title: string
  description: string
  filters: ShopFilters
  count: number
  /** Permanent commercial pages remain available when single-unit stock turns. */
  evergreen?: boolean
}

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

const CORE_COLLECTIONS: Array<{
  slug: string
  title: string
  description: string
  filters: ShopFilters
}> = [
  {
    slug: 'necklaces',
    title: 'Fine Necklaces',
    description:
      'One-of-a-kind fine necklaces selected for the HV Jewelers Houston showroom. Availability changes as single pieces sell.',
    filters: withFilters({ category: ['Necklaces'] }),
  },
  {
    slug: 'earrings',
    title: 'Fine Earrings',
    description:
      'One-of-a-kind fine earrings in gold and platinum, selected for the HV Jewelers Houston showroom.',
    filters: withFilters({ category: ['Earrings'] }),
  },
  {
    slug: 'rings',
    title: 'Fine Rings',
    description:
      'Fine rings and statement bands held in our Houston showroom, with one piece available per design.',
    filters: withFilters({ category: ['Rings'] }),
  },
  {
    slug: 'pendants',
    title: 'Fine Pendants',
    description:
      'Gold, platinum, diamond, and gemstone pendants selected one design at a time for the HV Jewelers collection.',
    filters: withFilters({ category: ['Pendants'] }),
  },
  {
    slug: 'bracelets',
    title: 'Fine Bracelets & Bangles',
    description:
      'Fine bracelets and bangles from the HV Jewelers Houston showroom, including one-of-a-kind diamond and gemstone pieces.',
    filters: withFilters({ category: ['Bracelets'] }),
  },
  {
    slug: 'diamond-jewelry',
    title: 'Diamond Jewelry',
    description:
      'One-of-a-kind diamond jewelry in gold and platinum, available online or for a private viewing in Houston.',
    filters: withFilters({ stone: ['Diamond'] }),
  },
  {
    slug: 'emerald-jewelry',
    title: 'Emerald Jewelry',
    description:
      'Emerald rings, earrings, pendants, necklaces, and bracelets selected for color, design, and wearability.',
    filters: withFilters({ stone: ['Emerald'] }),
  },
  {
    slug: 'jade-jewelry',
    title: 'Jade Jewelry',
    description:
      'Natural jade jewelry set in fine gold or platinum, held at the HV Jewelers Houston showroom.',
    filters: withFilters({ stone: ['Jade'] }),
  },
  {
    slug: 'gifts-under-1500',
    title: 'Gifts Under $1,500',
    description:
      'One-of-a-kind fine-jewelry gifts priced below $1,500, with insured US shipping or Houston pickup.',
    filters: withFilters({ price: [PRICE_BANDS[0]?.id ?? '0-1500'] }),
  },
  {
    slug: 'gifts-under-2500',
    title: 'Gifts Under $2,500',
    description:
      'Fine-jewelry gifts below $2,500, selected one piece per design and available while in stock.',
    filters: withFilters({
      price: PRICE_BANDS.slice(0, 2).map((band) => band.id),
    }),
  },
]

/**
 * Build permanent commercial collections first, then add catalog-supported
 * long-tail collections. Core URLs never disappear merely because a
 * one-of-one piece sells; dynamic stone/metal combinations still require at
 * least two currently available matches.
 */
export function buildCollections(products: ShopifyProduct[]): CollectionDef[] {
  const stocked = products
    .filter((product) => product.availableForSale)
    .map((product) => ({ product, facets: deriveFacets(product) }))

  const definitions: CollectionDef[] = []
  const seen = new Set<string>()

  const countMatches = (filters: ShopFilters): number =>
    stocked.filter(({ facets }) => matchesFilters(facets, filters)).length

  for (const collection of CORE_COLLECTIONS) {
    if (seen.has(collection.slug)) continue
    seen.add(collection.slug)
    definitions.push({
      ...collection,
      count: countMatches(collection.filters),
      evergreen: true,
    })
  }

  const add = (
    slug: string,
    title: string,
    describe: (count: number) => string,
    filters: ShopFilters,
  ): void => {
    if (!slug || seen.has(slug)) return
    const count = countMatches(filters)
    if (count < MIN_PIECES) return
    seen.add(slug)
    definitions.push({
      slug,
      title,
      description: describe(count),
      filters,
      count,
    })
  }

  const unique = <T,>(values: T[]): T[] => [...new Set(values)]
  const categories = unique(
    stocked.map(({ facets }) => facets.category),
  ).filter(Boolean)
  const stones = unique(stocked.flatMap(({ facets }) => facets.stones))
  const metals = unique(stocked.flatMap(({ facets }) => facets.metals))

  for (const category of categories) {
    add(
      slugify(category),
      category,
      (count) =>
        `${count} one-of-a-kind ${category.toLowerCase()} currently in the case at HV Jewelers.`,
      withFilters({ category: [category] }),
    )
  }

  for (const stone of stones) {
    if (stone === 'Mother of Pearl') continue
    for (const category of categories) {
      add(
        slugify(`${stone} ${category}`),
        `${stone} ${category}`,
        (count) =>
          `${count} ${stone.toLowerCase()} ${category.toLowerCase()}, each a single piece, photographed in house.`,
        withFilters({ stone: [stone], category: [category] }),
      )
    }
    add(
      slugify(`${stone} jewelry`),
      `${stone} Jewelry`,
      (count) =>
        `${count} pieces featuring ${stone.toLowerCase()}, one of each, currently available.`,
      withFilters({ stone: [stone] }),
    )
  }

  for (const metal of metals) {
    for (const category of categories) {
      add(
        slugify(`${metal} ${category}`),
        `${metal} ${category}`,
        (count) =>
          `${count} ${metal.toLowerCase()} ${category.toLowerCase()} in the case now, one piece per design.`,
        withFilters({ metal: [metal], category: [category] }),
      )
    }
  }

  return definitions
}

export function findCollection(
  products: ShopifyProduct[],
  slug: string,
): CollectionDef | null {
  return buildCollections(products).find((collection) => collection.slug === slug) ?? null
}
