import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import crypto from 'node:crypto'
import { serverEnv } from '@/lib/env'
import { SHOPIFY_TAGS } from '@/lib/shopify/client'

/**
 * Shopify webhook receiver. Verifies the HMAC-SHA256 signature the
 * Storefront infrastructure stamps in the `X-Shopify-Hmac-Sha256`
 * header, then invalidates the relevant fetch tags so the next visitor
 * sees fresh product data immediately (instead of waiting up to 600s
 * for the revalidate window to roll).
 *
 * Topics to wire in Shopify admin → Settings → Notifications:
 *   - products/create
 *   - products/update
 *   - products/delete
 *
 * Webhook URL: https://<your-domain>/api/shopify/webhook
 * Webhook format: JSON
 * Webhook API version: same as SHOPIFY_STOREFRONT_API_VERSION
 *
 * The shared secret Shopify shows you must be saved in env as
 * SHOPIFY_WEBHOOK_SECRET; without it the route returns 503 so a
 * forgotten env var fails closed.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signatureHeader, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const secret = serverEnv.SHOPIFY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 },
    )
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-shopify-hmac-sha256')
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const topic = req.headers.get('x-shopify-topic') ?? ''
  let payload: { id?: number; handle?: string } = {}
  try {
    payload = JSON.parse(rawBody) as typeof payload
  } catch {
    // Shopify always sends JSON; if it isn't, accept and skip.
  }

  // Invalidate the full product listing on any product change so the
  // /shop grid stays correct; also invalidate the per-handle tag so the
  // PDP picks up the change on next render.
  if (topic.startsWith('products/')) {
    revalidateTag(SHOPIFY_TAGS.products)
    if (payload.handle) {
      revalidateTag(SHOPIFY_TAGS.product(payload.handle))
    }
  }

  return NextResponse.json({ ok: true, topic, handle: payload.handle ?? null })
}
