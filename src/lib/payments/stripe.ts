import Stripe from 'stripe'
import { serverEnv } from '@/lib/env'

/**
 * Stripe SDK singleton — server-only. Never import from a client component.
 *
 * Configured lazily so the app shell (storefront pages that don't touch
 * payments) can boot without a key. Checkout and webhook paths throw a
 * clear error if the key is missing.
 */

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (client) return client
  if (!serverEnv.STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Set it in .env.local (dev) or your host (prod).',
    )
  }
  client = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
    typescript: true,
    appInfo: {
      name: 'HV Jewelers',
      version: '0.1.0',
    },
  })
  return client
}

export function isStripeConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY)
}

export function isTaxEnabled(): boolean {
  return serverEnv.STRIPE_TAX_ENABLED === 'true'
}
