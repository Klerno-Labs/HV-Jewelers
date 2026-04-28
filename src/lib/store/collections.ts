/**
 * Display metadata for the public collection routes. The DB Collection
 * row carries title and description; this map adds the editorial framing
 * (eyebrow, intro paragraph, accent tone) used on the collection hero.
 *
 * Slugs here are the canonical *public* URLs and must match the seeded
 * collection slugs.
 */

export interface CollectionMeta {
  slug: string
  title: string
  /// Short label above the title.
  eyebrow: string
  /// Editorial intro shown on the collection page hero.
  intro: string
  /// Optional secondary line for breathing room.
  notes?: string
}

const META: Record<string, CollectionMeta> = {
  'vintage-era': {
    slug: 'vintage-era',
    title: 'Vintage Era',
    eyebrow: '1980s and 1990s, unworn',
    intro:
      'Pieces from the 1980s and 1990s that came directly from jewelry stores. They were made for retail, kept in inventory, and never sold to a customer. We verify each piece in person and describe what we see. Vintage Era pieces are final sale, so the writeup has to do the work.',
    notes: 'Sized as made. Resizing available on select pieces.',
  },
  'near-vintage': {
    slug: 'near-vintage',
    title: 'Near Vintage',
    eyebrow: 'Roughly the last fifteen years',
    intro:
      'Pieces from the late 2000s and 2010s. Newer than Vintage Era but still kept aside in store inventory long enough that we can list them as unworn. Often unsigned. Final sale.',
  },
  'modern-fine-jewelry': {
    slug: 'modern-fine-jewelry',
    title: 'Modern Fine Jewelry',
    eyebrow: 'Made now',
    intro:
      'New pieces made on the bench today. Bands, solitaires, everyday gold. Most are eligible for a 15-day return on unworn returns. Resizing voids that window.',
  },
  gold: {
    slug: 'gold',
    title: 'Gold',
    eyebrow: 'By karat and weight',
    intro:
      'Gold-forward pieces from across the catalog: signets, bands, chains, and modern settings. Gram weight is shown when it matters.',
  },
  pearls: {
    slug: 'pearls',
    title: 'Pearls',
    eyebrow: 'Strung and set',
    intro:
      'Strands, drops, and pearl detail. All unworn, on original silk where applicable, with original clasps when they were part of the piece.',
  },
  'new-arrivals': {
    slug: 'new-arrivals',
    title: 'New Arrivals',
    eyebrow: 'Most recent',
    intro:
      'Pieces newly added to the catalog. We add a small set every few weeks; we would rather be slow than wrong.',
  },
}

export function getCollectionMeta(slug: string): CollectionMeta | null {
  return META[slug] ?? null
}

export const PUBLIC_COLLECTION_SLUGS = Object.keys(META) as readonly string[]

/**
 * Display order for the collection-worlds grid on the homepage and the
 * primary site nav.
 */
export const NAV_COLLECTION_ORDER: readonly string[] = [
  'vintage-era',
  'near-vintage',
  'modern-fine-jewelry',
  'gold',
  'pearls',
  'new-arrivals',
]
