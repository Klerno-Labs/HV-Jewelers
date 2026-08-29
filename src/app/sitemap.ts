import type { MetadataRoute } from 'next'
import {
  listAllProductsForPages,
  listProductHandles,
} from '@/lib/shopify/products'
import { buildCollections } from '@/lib/shopify/collections'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://hvjewelers.com'

/**
 * Static pages, the catalog, permanent commercial collections, and every
 * published Shopify product. The production origin is the safe fallback so a
 * missing preview variable can never emit localhost URLs into the live map.
 * Permanent routes remain present even during a temporary Shopify outage.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/collections`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/care`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  const products = await listAllProductsForPages()
  const collectionEntries: MetadataRoute.Sitemap = buildCollections(products).map(
    (collection) => ({
      url: `${SITE_URL}/collections/${collection.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: collection.evergreen ? 0.85 : 0.75,
    }),
  )

  const handles = await listProductHandles(250)
  const productEntries: MetadataRoute.Sitemap = handles.map((product) => ({
    url: `${SITE_URL}/shop/${product.handle}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...collectionEntries, ...productEntries]
}
