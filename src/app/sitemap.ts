import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { PUBLIC_COLLECTION_SLUGS } from '@/lib/store/collections'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

/**
 * Sitemap. Static pages + live collection pages + live product pages +
 * published journal entries. Fails soft when the DB is unreachable —
 * we return just the static pages so crawlers never see a blank site.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/care`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/journal`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  const collectionEntries: MetadataRoute.Sitemap = PUBLIC_COLLECTION_SLUGS.map(
    (slug) => ({
      url: `${SITE_URL}/collections/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }),
  )

  try {
    const [products, posts] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE', isHidden: false },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.editorialPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        take: 1000,
      }),
    ])

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/journal/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    return [
      ...staticEntries,
      ...collectionEntries,
      ...productEntries,
      ...postEntries,
    ]
  } catch {
    return [...staticEntries, ...collectionEntries]
  }
}
