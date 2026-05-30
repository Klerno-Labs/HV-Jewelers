import type { NextConfig } from 'next'

/**
 * Security response headers. Sensible baseline for an e-commerce site
 * that serves an httpOnly cart cookie and renders merchant-controlled
 * HTML via dangerouslySetInnerHTML (PDP descriptionHtml, sanitized).
 *
 * - HSTS: lock to HTTPS for the apex + subdomains (preload eligible)
 * - nosniff: disable MIME-type sniffing
 * - Referrer-Policy: don't leak full URLs cross-origin
 * - Permissions-Policy: deny sensor APIs we never use
 * - frame-ancestors 'self': prevent clickjacking on cart/checkout
 * - X-Frame-Options is the legacy companion to frame-ancestors
 */
const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Content-Security-Policy',
    // Permissive CSP focused on framing + img/connect/form-action.
    // No script/style restrictions yet — Next inlines runtime scripts
    // and we'd need nonces to tighten further (tracked as a follow-up).
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https://cdn.shopify.com https://res.cloudinary.com",
      "media-src 'self' https://cdn.shopify.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.myshopify.com https://shopify.com",
      "frame-ancestors 'self'",
      "form-action 'self' https://*.myshopify.com https://checkout.shopify.com",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
]

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
  experimental: {
    // Security-related experimentals can be toggled here in later phases.
  },
}

export default nextConfig
