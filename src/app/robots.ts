import type { MetadataRoute } from 'next'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

/**
 * robots.txt — allow indexing of the public catalog, block private
 * routes (admin, checkout transactions, auth, internal specs).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/api/',
          '/checkout/',
          '/login',
          '/invite',
          '/account',
          '/bag',
          '/sign-out',
          '/style',
          '/typography',
          '/colors',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
