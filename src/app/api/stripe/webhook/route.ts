import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, isStripeConfigured } from '@/lib/payments/stripe'
import { serverEnv } from '@/lib/env'
import {
  cancelOrderFromSession,
  finalizeOrderFromSession,
} from '@/lib/orders/checkout'

/**
 * Stripe webhook handler. Signature verification is the only auth — the
 * secret is shared with Stripe at the dashboard / CLI and never leaves
 * the server.
 *
 * Events we act on:
 *   • checkout.session.completed        — finalize order + mark inventory SOLD
 *   • checkout.session.expired          — cancel order + release inventory
 *   • checkout.session.async_payment_failed — same as expired
 *   • checkout.session.async_payment_succeeded — finalize (for async methods)
 *
 * Everything else is acknowledged with 200 so Stripe stops retrying.
 *
 * Idempotency lives in the downstream helpers (they guard on current
 * order status), so re-delivery is safe.
 */

// Webhooks must read the raw body for signature verification. Force
// dynamic so Next doesn't attempt static optimization.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isStripeConfigured() || !serverEnv.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 },
    )
  }

  const sig = (await headers()).get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      serverEnv.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.warn('[stripe-webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        const result = await finalizeOrderFromSession(session)
        if (!result.ok) {
          console.warn(
            `[stripe-webhook] ${event.type} skipped: ${result.reason}`,
            { sessionId: session.id },
          )
        }
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await cancelOrderFromSession(session, 'expired')
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        await cancelOrderFromSession(session, 'async_failed')
        break
      }
      default:
        // Ack unknown events so Stripe stops retrying. Log for visibility
        // during rollout; remove the log once events stabilize.
        console.info('[stripe-webhook] ignoring event', event.type)
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error', err)
    // Return 500 so Stripe retries. Delivery is idempotent.
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
