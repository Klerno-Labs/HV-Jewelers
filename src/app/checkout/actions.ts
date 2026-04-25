'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  createPendingOrder,
  createStripeSessionForOrder,
  extendReservationsForCheckout,
  rollbackPendingOrder,
  validateCartForCheckout,
} from '@/lib/orders/checkout'
import { getCartToken } from '@/lib/cart/cart'
import { isStripeConfigured, isTaxEnabled } from '@/lib/payments/stripe'
import { prisma } from '@/lib/prisma'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

/**
 * Start checkout. Server action wired to a form on /bag.
 *
 * Flow:
 *   1. Read cart cookie.
 *   2. Validate that every line is still purchasable (product active,
 *      inventory still reserved to this cart).
 *   3. Extend reservations to 30 minutes so Stripe has room.
 *   4. Create a PENDING Order with immutable per-line policy snapshots.
 *   5. Create a Stripe Checkout session; persist its id on the Order.
 *   6. Redirect to Stripe's hosted payment page.
 *
 * On any Stripe error we roll the PENDING order back and release the
 * inventory.
 */
export async function startCheckout() {
  if (!isStripeConfigured()) {
    redirect('/bag?error=checkout_unavailable')
  }

  const token = await getCartToken()
  if (!token) redirect('/bag')

  const session = await auth()
  const userId = session?.user?.id ?? null
  const email = session?.user?.email ?? null

  // 1. Validate cart.
  const validation = await validateCartForCheckout(token)
  if (!validation.ok) {
    // Collapse all validation issues into a single error code for the URL.
    // The /bag page surfaces the specific copy.
    const firstKind = validation.issues[0]?.kind ?? 'empty'
    redirect(`/bag?error=${firstKind}`)
  }

  const { cart } = validation

  // 2. Extend reservations to checkout TTL.
  await extendReservationsForCheckout(cart)

  // 3. Create PENDING order with policy snapshots.
  const { order, shippingProfile } = await createPendingOrder({
    cart,
    userId,
    email,
  })

  // 4. Create Stripe session. If this fails, roll back.
  let stripeUrl: string | null = null
  try {
    const stripeSession = await createStripeSessionForOrder({
      order,
      cart,
      shippingProfile,
      siteUrl: SITE_URL,
      enableAutomaticTax: isTaxEnabled(),
    })

    // Persist the session id so the webhook + the success page can look up.
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: stripeSession.id },
    })

    stripeUrl = stripeSession.url
  } catch (err) {
    console.error('[checkout] Stripe session creation failed', err)
    await rollbackPendingOrder(order.id)
    redirect('/bag?error=checkout_failed')
  }

  if (!stripeUrl) {
    await rollbackPendingOrder(order.id)
    redirect('/bag?error=checkout_failed')
  }

  redirect(stripeUrl)
}
