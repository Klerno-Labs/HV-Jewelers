import type Stripe from 'stripe'
import { Prisma, type OrderLine } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/payments/stripe'
import { generateOrderNumber } from './order-number'
import { snapshotPolicy } from '@/lib/products/policy'
import {
  extendReservation,
  markSold,
  releaseIfReserved,
} from '@/lib/products/inventory'

/**
 * Server-only checkout helpers.
 *
 * Flow of a successful checkout:
 *   1. validateCartForCheckout — confirms each line is still available,
 *      reserved to this cart, and the product is active.
 *   2. extendReservationsForCheckout — pushes the 15-minute cart
 *      reservation out to 30 minutes so Stripe has room to collect
 *      payment.
 *   3. createPendingOrder — writes the Order row with PENDING status and
 *      per-line policy snapshots (immutable record of what the customer
 *      agreed to).
 *   4. createStripeSession — calls Stripe Checkout; persists
 *      stripeCheckoutSessionId on the Order.
 *
 * On webhook `checkout.session.completed`:
 *   5. finalizeOrderFromSession — writes Stripe's shipping + totals onto
 *      the Order, flips status to PAID, marks each InventoryItem SOLD,
 *      marks the Cart CONVERTED, records OrderEvent("PAID").
 *
 * On webhook `checkout.session.expired` / `async_payment_failed`:
 *   6. cancelOrderFromSession — flips status to CANCELLED, releases
 *      every RESERVED inventory item, records OrderEvent("CANCELLED").
 */

// ─────────────────────────────────────────────────────────────────────
//  Validation
// ─────────────────────────────────────────────────────────────────────

export type CheckoutValidationIssue =
  | { kind: 'empty' }
  | { kind: 'product_inactive'; productSlug: string; productTitle: string }
  | { kind: 'no_stock'; productSlug: string; productTitle: string }
  | { kind: 'held_by_another'; productSlug: string; productTitle: string }

export type CartForCheckout = NonNullable<
  Awaited<ReturnType<typeof loadCartForCheckout>>
>

async function loadCartForCheckout(token: string) {
  return prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' }, take: 1 },
            },
          },
          inventoryItem: true,
        },
      },
    },
  })
}

export async function validateCartForCheckout(token: string): Promise<
  | { ok: true; cart: CartForCheckout }
  | { ok: false; issues: CheckoutValidationIssue[] }
> {
  const cart = await loadCartForCheckout(token)
  if (!cart || cart.status !== 'OPEN' || cart.items.length === 0) {
    return { ok: false, issues: [{ kind: 'empty' }] }
  }

  const issues: CheckoutValidationIssue[] = []
  for (const item of cart.items) {
    if (item.product.status !== 'ACTIVE' || item.product.isHidden) {
      issues.push({
        kind: 'product_inactive',
        productSlug: item.product.slug,
        productTitle: item.product.title,
      })
      continue
    }
    // MADE_TO_ORDER has no inventory row — skip inventory checks.
    if (item.product.stockMode === 'MADE_TO_ORDER') continue

    if (!item.inventoryItem) {
      issues.push({
        kind: 'no_stock',
        productSlug: item.product.slug,
        productTitle: item.product.title,
      })
      continue
    }
    if (item.inventoryItem.status !== 'RESERVED') {
      issues.push({
        kind: 'no_stock',
        productSlug: item.product.slug,
        productTitle: item.product.title,
      })
      continue
    }
    if (item.inventoryItem.reservedCartId !== cart.id) {
      issues.push({
        kind: 'held_by_another',
        productSlug: item.product.slug,
        productTitle: item.product.title,
      })
    }
  }

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, cart }
}

// ─────────────────────────────────────────────────────────────────────
//  Reservation extension
// ─────────────────────────────────────────────────────────────────────

const CHECKOUT_RESERVATION_MS = 30 * 60 * 1000 // 30 min

export async function extendReservationsForCheckout(cart: CartForCheckout) {
  const newExpiresAt = new Date(Date.now() + CHECKOUT_RESERVATION_MS)
  for (const item of cart.items) {
    if (item.inventoryItemId) {
      await extendReservation({
        inventoryItemId: item.inventoryItemId,
        cartId: cart.id,
        newExpiresAt,
      })
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Order creation
// ─────────────────────────────────────────────────────────────────────

export async function createPendingOrder(args: {
  cart: CartForCheckout
  userId: string | null
  email: string | null
}) {
  const { cart, userId, email } = args

  const subtotalCents = cart.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  )
  const orderNumber = await generateOrderNumber()

  const defaultProfile = await prisma.shippingProfile.findFirst({
    where: { isDefault: true },
  })

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      email: email ?? '',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'UNFULFILLED',
      currency: 'USD',
      subtotalCents,
      shippingCents: 0,
      taxCents: 0,
      discountCents: 0,
      totalCents: subtotalCents,
      // Placeholder shipping fields — Stripe fills these in on
      // checkout.session.completed.
      shipName: '',
      shipLine1: '',
      shipCity: '',
      shipRegion: '',
      shipPostalCode: '',
      shipCountry: 'US',
      signatureRequired: defaultProfile?.signature !== 'NONE',
      shippingProfileSnapshot: defaultProfile
        ? ({
            id: defaultProfile.id,
            name: defaultProfile.name,
            baseRateCents: defaultProfile.baseRateCents,
            signature: defaultProfile.signature,
            insuranceLevel: defaultProfile.insuranceLevel,
            carrierPreference: defaultProfile.carrierPreference,
          } as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  })

  // OrderLines — one per cart item, with an immutable policy snapshot.
  for (const item of cart.items) {
    const policy = snapshotPolicy(item.product)
    const heroImageUrl = item.product.images[0]?.url ?? null
    await prisma.orderLine.create({
      data: {
        orderId: order.id,
        productId: item.product.id,
        inventoryItemId: item.inventoryItemId,
        productTitle: item.product.title,
        productSlug: item.product.slug,
        productEra: item.product.era,
        productImage: heroImageUrl,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.unitPriceCents * item.quantity,
        ...policy,
      },
    })
  }

  return { order, shippingProfile: defaultProfile }
}

// ─────────────────────────────────────────────────────────────────────
//  Stripe session
// ─────────────────────────────────────────────────────────────────────

export async function createStripeSessionForOrder(args: {
  order: { id: string; email: string | null; orderNumber: string }
  cart: CartForCheckout
  shippingProfile: Awaited<
    ReturnType<typeof prisma.shippingProfile.findFirst>
  >
  siteUrl: string
  enableAutomaticTax: boolean
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: args.cart.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.title,
          description: item.product.shortDescription ?? undefined,
          metadata: {
            productId: item.product.id,
            productSlug: item.product.slug,
            era: item.product.era,
          },
        },
        unit_amount: item.unitPriceCents,
      },
      quantity: item.quantity,
    })),
    shipping_address_collection: { allowed_countries: ['US'] },
    shipping_options: args.shippingProfile
      ? [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: args.shippingProfile.baseRateCents,
                currency: 'usd',
              },
              display_name: args.shippingProfile.name,
            },
          },
        ]
      : [],
    payment_method_types: ['card'],
    customer_email: args.order.email || undefined,
    client_reference_id: args.order.id,
    success_url: `${args.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${args.siteUrl}/checkout/cancelled?order=${args.order.id}`,
    metadata: {
      orderId: args.order.id,
      cartId: args.cart.id,
      cartToken: args.cart.token,
      orderNumber: args.order.orderNumber,
    },
    // 30-minute session — matches the reservation extension.
    expires_at: Math.floor((Date.now() + CHECKOUT_RESERVATION_MS) / 1000),
  }

  if (args.enableAutomaticTax) {
    sessionParams.automatic_tax = { enabled: true }
  }

  return stripe.checkout.sessions.create(sessionParams)
}

// ─────────────────────────────────────────────────────────────────────
//  Webhook finalization
// ─────────────────────────────────────────────────────────────────────

export async function finalizeOrderFromSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId
  if (!orderId) return { ok: false, reason: 'no_order_id' as const }

  // Async payment methods deliver `checkout.session.completed` with
  // payment_status='unpaid'. Only finalize on 'paid'.
  if (session.payment_status !== 'paid') {
    return { ok: false, reason: 'not_paid' as const }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  })
  if (!order) return { ok: false, reason: 'order_not_found' as const }
  // Idempotency: Stripe retries webhooks; don't double-apply.
  if (order.paymentStatus === 'CAPTURED') {
    return { ok: true, already: true as const }
  }

  // Pull address + totals. Prefer fields on the session payload (Stripe
  // sends them for completed sessions); fall back to a retrieve.
  const shipName = session.shipping_details?.name ?? order.shipName
  const addr = session.shipping_details?.address
  const totals = session.total_details

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null)

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      paymentStatus: 'CAPTURED',
      fulfillmentStatus: 'PROCESSING',
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
      email: session.customer_details?.email ?? order.email,
      shipName,
      shipLine1: addr?.line1 ?? order.shipLine1,
      shipLine2: addr?.line2 ?? order.shipLine2,
      shipCity: addr?.city ?? order.shipCity,
      shipRegion: addr?.state ?? order.shipRegion,
      shipPostalCode: addr?.postal_code ?? order.shipPostalCode,
      shipCountry: (addr?.country ?? order.shipCountry).toUpperCase().slice(0, 2),
      shipPhone: session.customer_details?.phone ?? order.shipPhone,
      shippingCents: session.shipping_cost?.amount_total ?? 0,
      taxCents: totals?.amount_tax ?? 0,
      discountCents: totals?.amount_discount ?? 0,
      totalCents: session.amount_total ?? order.totalCents,
    },
  })

  // Mark every reserved inventory item SOLD. Idempotent — markSold only
  // transitions RESERVED→SOLD.
  for (const line of order.lines) {
    if (line.inventoryItemId) {
      await markSold({
        inventoryItemId: line.inventoryItemId,
        orderLineId: line.id,
      })
    }
  }

  // Mark the cart CONVERTED so the customer's header stops displaying it.
  if (session.metadata?.cartId) {
    await prisma.cart.updateMany({
      where: { id: session.metadata.cartId, status: 'OPEN' },
      data: { status: 'CONVERTED' },
    })
  }

  await prisma.orderEvent.create({
    data: {
      orderId,
      type: 'PAID',
      description: 'Payment received via Stripe.',
      isCustomerVisible: true,
      context: paymentIntentId ? { paymentIntentId } : undefined,
    },
  })

  // Send the order confirmation email. Fail-soft: a failed send must
  // never break the webhook ack, otherwise Stripe re-delivers and we
  // double-write side effects.
  try {
    const full = await prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    })
    if (full) {
      const { sendOrderConfirmation } = await import('@/lib/emails/send')
      await sendOrderConfirmation(full)
    }
  } catch (err) {
    console.error('[checkout] order confirmation email threw', err)
  }

  return { ok: true, already: false as const }
}

export async function cancelOrderFromSession(
  session: Stripe.Checkout.Session,
  reason: 'expired' | 'async_failed',
) {
  const orderId = session.metadata?.orderId
  if (!orderId) return { ok: false, reason: 'no_order_id' as const }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  })
  if (!order) return { ok: false, reason: 'order_not_found' as const }
  if (order.status === 'CANCELLED' || order.paymentStatus === 'CAPTURED') {
    return { ok: true, already: true as const }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  })

  for (const line of order.lines) {
    if (line.inventoryItemId) {
      await releaseIfReserved({
        inventoryItemId: line.inventoryItemId,
        reason: `order.cancel.${reason}`,
      })
    }
  }

  await prisma.orderEvent.create({
    data: {
      orderId,
      type: 'CANCELLED',
      description:
        reason === 'expired'
          ? 'Stripe checkout session expired.'
          : 'Asynchronous payment failed.',
      isCustomerVisible: false,
    },
  })

  return { ok: true, already: false as const }
}

/**
 * Reverse a PENDING order that was created but never shipped to Stripe
 * (for example when the Stripe session could not be created). Releases
 * inventory and marks the order CANCELLED.
 */
export async function rollbackPendingOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: { select: { inventoryItemId: true } } },
  })
  if (!order || order.status !== 'PENDING') return

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })

  for (const line of order.lines) {
    if (line.inventoryItemId) {
      await releaseIfReserved({
        inventoryItemId: line.inventoryItemId,
        reason: 'checkout.rollback',
      })
    }
  }

  await prisma.orderEvent.create({
    data: {
      orderId,
      type: 'CANCELLED',
      description: 'Stripe session could not be created — order rolled back.',
      isCustomerVisible: false,
    },
  })
}

// Re-export the policy-snapshot shape for convenience in other modules.
export type { OrderLine }
