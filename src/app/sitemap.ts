import type { MetadataRoute } from 'next'
import { listProductHandles } from '@/lib/shopify/products'

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
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/care`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  const handles = await listProductHandles(250)
  const productEntries: MetadataRoute.Sitemap = handles.map((p) => ({
    url: `${SITE_URL}/shop/${p.handle}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...productEntries]
}
