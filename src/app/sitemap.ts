import type { MetadataRoute } from 'next'
import { listProductHandles, listAllProducts } from '@/lib/shopify/products'
import { buildCollections } from '@/lib/shopify/collections'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

/**
 * Sitemap. Static pages + the /shop catalog + every published Shopify
 * product. `listProductHandles` fails soft (returns []) when Shopify is
 * unreachable, so crawlers never see a blank site.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/collections`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/care`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Collection pages are the store's indexable taxonomy — the pages that
  // can rank for "emerald necklace" where a product title never will.
  const products = await listAllProducts()
  const collectionEntries: MetadataRoute.Sitemap = buildCollections(products).map(
    (c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }),
  )

  const handles = await listProductHandles(250)
  const productEntries: MetadataRoute.Sitemap = handles.map((p) => ({
    url: `${SITE_URL}/shop/${p.handle}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...collectionEntries, ...productEntries]
}
