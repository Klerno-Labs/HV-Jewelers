import { NextResponse } from 'next/server'
import { shopifyConfigured } from '@/lib/shopify/client'

/**
 * Liveness probe. Kept intentionally narrow — returns only boolean health
 * signals, never secrets or env state. Safe to expose to uptime monitors.
 *
 * There is no database to probe any more; the storefront reads everything
 * from Shopify. `shopify` reports whether the Storefront credentials are
 * present, which is a config check, not a network call — so the probe stays
 * cheap enough to poll and can't be rate-limited by Shopify.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const shopify = shopifyConfigured()
  return NextResponse.json(
    { ok: shopify, shopify },
    { status: shopify ? 200 : 503 },
  )
}
