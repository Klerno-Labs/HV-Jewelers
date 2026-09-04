import type { NextConfig } from 'next'

/**
 * Static response headers. Security headers + CSP live in
 * `src/middleware.ts` because the CSP is nonce-stamped per request
 * (`strict-dynamic`) and must run on every response, not just the ones
 * Next.js touches at build time. Anything that can be set statically
 * without per-request data goes here.
 *
 * `poweredByHeader: false` strips Next's default `X-Powered-By: Next.js`
 * leak so frontend probes don't get a free framework fingerprint.
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    // Strip console calls from prod bundles; leave errors + warnings for visibility.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    // Shopify CDN does its own resizing (see src/lib/shopify-image-loader.ts) —
    // this keeps every product photo off Vercel's billed Image Optimization API,
    // which the growing catalog was exceeding (402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED).
    loader: 'custom',
    loaderFile: './src/lib/shopify-image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
    ],
  },
  /**
   * Shopify-native URL shapes → this storefront's routes.
   *
   * The catalog is headless: Shopify owns the products, but the pages
   * live at `/shop/<handle>`. Anything generated Shopify-side — the
   * Google & YouTube channel's Merchant Center landing pages, old links,
   * pasted admin URLs — points at `/products/<handle>`, which 404s here.
   * A 404 landing page is why Merchant Center parks items in review
   * instead of approving them, so these redirects are load-bearing for
   * the product feed, not just cosmetic link hygiene.
   *
   * The handle is identical on both sides, so the mapping is 1:1.
   *
   * Explicit 301 rather than Next's `permanent: true` (which emits 308).
   * Google treats the two as equivalent, but 301 is what every feed
   * validator and legacy crawler understands, and nothing here needs
   * 308's method preservation — these are GETs.
   */
  async redirects() {
    return [
      {
        source: '/products/:handle',
        destination: '/shop/:handle',
        statusCode: 301,
      },
      // Shopify also emits collection-scoped product URLs.
      {
        source: '/collections/:collection/products/:handle',
        destination: '/shop/:handle',
        statusCode: 301,
      },
      {
        source: '/collections/all',
        destination: '/shop',
        statusCode: 301,
      },
    ]
  },
}

export default nextConfig
