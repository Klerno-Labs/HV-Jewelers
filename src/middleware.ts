import { NextResponse, type NextRequest } from 'next/server'

// Canonical host for self-referencing rel=canonical. Fixed origin (never the
// request host) so apex/www variants collapse to one URL.
const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hvjewelers.com'
).replace(/\/$/, '')

/**
 * Middleware is the first security layer:
 *   1. Generates a per-request nonce and attaches a strict CSP.
 *   2. Applies baseline security headers.
 *   3. Emits a self-referencing canonical Link header on indexable pages.
 *
 * There is no auth gate here any more: the storefront has no authenticated
 * surface. Catalog and orders are managed in Shopify admin, and the site is
 * a read-only Shopify client, so there is nothing left to sign in to.
 */

function buildCsp(nonce: string, isDev: boolean) {
  const directives = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        ...(isDev ? ["'unsafe-eval'"] : []),
      ],
    ],
    [
      "style-src",
      [
        "'self'",
        `'nonce-${nonce}'`,
        // Kept for legacy browsers without style-src-attr support. Per CSP3
        // a nonce in this list makes modern browsers ignore 'unsafe-inline'
        // here entirely — including for style *attributes* — so the real
        // attribute allowance lives in style-src-attr below.
        "'unsafe-inline'",
      ],
    ],
    // Inline `style` *attributes* are emitted by next/image, and product
    // tiles carry per-photo sampled background colors as style attributes.
    // style-src-attr governs only attributes; <style> tags stay
    // nonce-protected via style-src above.
    ["style-src-attr", ["'unsafe-inline'"]],
    [
      "img-src",
      [
        "'self'",
        "data:",
        "blob:",
        "https://cdn.shopify.com",
        "https://res.cloudinary.com",
      ],
    ],
    ["font-src", ["'self'", "data:"]],
    [
      "connect-src",
      [
        "'self'",
        // Reserved for future client-side Storefront API calls; today
        // every Shopify call is server-side, but allowing the storefront
        // domain costs nothing and avoids a silent breakage if a client
        // GraphQL fetch is added later.
        "https://zvf91s-qy.myshopify.com",
        ...(isDev ? ["ws:", "http://localhost:*"] : []),
      ],
    ],
    ["frame-src", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    // Cart checkout redirects to a Shopify-hosted page via Server Action +
    // `redirect()`; that's a 302 response, not a <form action> target, so
    // we don't need to allowlist Shopify here.
    ["form-action", ["'self'"]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
  ] as const

  const policy = directives
    .map(([d, values]) => `${d} ${(values as readonly string[]).join(' ')}`)
    .join('; ')

  return isDev ? policy : `${policy}; upgrade-insecure-requests`
}

function applySecurityHeaders(res: NextResponse, csp: string) {
  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  )
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  )
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
}

export default function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const isDev = process.env.NODE_ENV !== 'production'
  const csp = buildCsp(nonce, isDev)

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  applySecurityHeaders(res, csp)

  // Self-referencing canonical for indexable pages. Points at the clean apex
  // URL with no query string and no trailing slash, so apex/www, http/https,
  // trailing-slash, and ?param variants all consolidate to one canonical —
  // clearing GSC's "Duplicate without user-selected canonical". Google honors
  // the HTTP Link header equivalently to <link rel="canonical">. Skip /api
  // (non-indexable). `append` preserves any framework Link headers.
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/api')) {
    const path =
      pathname !== '/' && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname
    res.headers.append('Link', `<${SITE_ORIGIN}${path}>; rel="canonical"`)
  }

  return res
}

export const config = {
  // Skip static assets and Next internals; run on everything else.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|woff2?|ttf|html)$).*)',
  ],
}

// Silences unused-variable warnings in strict mode if the type import is ever
// removed during refactors.
export type { NextRequest }
