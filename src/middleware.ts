import { NextResponse, type NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

/**
 * Middleware is the first security layer:
 *   1. Generates a per-request nonce and attaches a strict CSP.
 *   2. Applies baseline security headers.
 *   3. Gates `/admin/*` to authenticated STAFF/ADMIN users (redirects otherwise).
 *
 * Every privileged Server Component / Action / Route Handler MUST still perform
 * its own server-side role check via `requireAdmin()` or `requireStaffOrAdmin()`.
 * Middleware can be bypassed by edge-case misconfig; the server-side gate is
 * the real enforcement.
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
        // Inline `style` *attributes* are emitted by next/image and other
        // framework primitives. Per CSP3, when both a nonce and 'unsafe-inline'
        // appear in style-src, browsers prefer the nonce for `<style>` tags
        // (so those remain protected) and only consult 'unsafe-inline' for
        // attribute-level styles. Net: tags stay strict, attributes pass.
        "'unsafe-inline'",
      ],
    ],
    ["img-src", ["'self'", "data:", "blob:", "https://res.cloudinary.com"]],
    ["font-src", ["'self'", "data:"]],
    [
      "connect-src",
      ["'self'", ...(isDev ? ["ws:", "http://localhost:*"] : [])],
    ],
    ["frame-src", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
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

export default auth((req) => {
  const nonce = btoa(crypto.randomUUID())
  const isDev = process.env.NODE_ENV !== 'production'
  const csp = buildCsp(nonce, isDev)

  // Admin gate. Server-side route handlers must re-check this.
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const session = req.auth
    if (!session?.user) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      // Carry a safe `from` param — path only, no host, no protocol.
      const safeFrom = req.nextUrl.pathname.startsWith('/')
        ? req.nextUrl.pathname
        : '/'
      url.searchParams.set('from', safeFrom)
      const redirect = NextResponse.redirect(url)
      applySecurityHeaders(redirect, csp)
      return redirect
    }
    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'STAFF') {
      const forbidden = new NextResponse('Forbidden', { status: 403 })
      applySecurityHeaders(forbidden, csp)
      return forbidden
    }
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  applySecurityHeaders(res, csp)
  return res
})

export const config = {
  // Skip static assets and Next internals; run on everything else.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|woff2?|ttf)$).*)',
  ],
}

// Silences unused-variable warnings in strict mode if the type import is ever
// removed during refactors.
export type { NextRequest }
