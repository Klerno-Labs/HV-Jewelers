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
}

export default nextConfig
