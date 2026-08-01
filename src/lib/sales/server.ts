import 'server-only'

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isProd, serverEnv } from '@/lib/env'
import {
  paidOrderSchema,
  safeMoney,
  storefrontCartToken,
  type ClientSalesEvent,
} from './contracts'

const SESSION_COOKIE = isProd ? '__Host-hv.sales.session' : 'hv.sales.session'
const SESSION_MAX_AGE = 60 * 60 * 4
const ATTRIBUTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function salesMeasurementConfigured(): boolean {
  return (
    serverEnv.SALES_MEASUREMENT_ENABLED === 'true' &&
    Boolean(serverEnv.SALES_ANALYTICS_SALT)
  )
}

export function hashSalesIdentifier(value: string): string {
  const salt = serverEnv.SALES_ANALYTICS_SALT
  if (!salt) throw new Error('Sales analytics salt is not configured')
  return crypto.createHmac('sha256', salt).update(value, 'utf8').digest('hex')
}

export async function storeSalesSessionCookie(sessionId: string): Promise<void> {
  const jar = await cookies()
  jar.set({
    name: SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function readSalesSessionHash(): Promise<string | null> {
  if (!salesMeasurementConfigured()) return null
  const jar = await cookies()
  const sessionId = jar.get(SESSION_COOKIE)?.value
  return sessionId ? hashSalesIdentifier(sessionId) : null
}

export async function recordClientSalesEvent(
  event: ClientSalesEvent,
): Promise<void> {
  if (!salesMeasurementConfigured()) return
  await prisma.salesEvent.create({
    data: {
      eventType: event.eventType,
      sessionHash: hashSalesIdentifier(event.sessionId),
      productId: event.productId,
      variantId: event.variantId,
      source: event.source,
      medium: event.medium,
      campaign: event.campaign,
      experimentId: event.experimentId,
      experimentVariant: event.experimentVariant,
      evidenceSource: 'first-party:validated-client-event',
    },
  })
}

export async function recordCheckoutStarted(cart: {
  id: string
  cost: { subtotalAmount: { amount: string; currencyCode: string } }
}): Promise<void> {
  if (!salesMeasurementConfigured()) return
  const sessionHash = await readSalesSessionHash()
  if (!sessionHash) return
  const cartHash = hashSalesIdentifier(storefrontCartToken(cart.id))
  const now = new Date()
  const firstTouch = await prisma.salesEvent.findFirst({
    where: { sessionHash },
    orderBy: { createdAt: 'asc' },
    select: { source: true, medium: true, campaign: true },
  })

  await prisma.$transaction([
    prisma.checkoutAttribution.upsert({
      where: { cartHash },
      create: {
        cartHash,
        sessionHash,
        expiresAt: new Date(now.getTime() + ATTRIBUTION_MAX_AGE_MS),
      },
      update: {
        sessionHash,
        expiresAt: new Date(now.getTime() + ATTRIBUTION_MAX_AGE_MS),
      },
    }),
    prisma.salesEvent.upsert({
      where: { externalEventId: `checkout:${cartHash}` },
      create: {
        eventType: 'checkout_started',
        sessionHash,
        source: firstTouch?.source ?? 'direct',
        medium: firstTouch?.medium ?? 'none',
        campaign: firstTouch?.campaign ?? 'none',
        value: safeMoney(cart.cost.subtotalAmount.amount),
        currency: cart.cost.subtotalAmount.currencyCode.toUpperCase(),
        externalEventId: `checkout:${cartHash}`,
        evidenceSource: 'server:shopify-cart-before-checkout',
      },
      update: {
        value: safeMoney(cart.cost.subtotalAmount.amount),
        currency: cart.cost.subtotalAmount.currencyCode.toUpperCase(),
      },
    }),
  ])
}

export async function recordPaidOrder(
  unsafePayload: unknown,
  webhookId: string,
): Promise<{ recorded: boolean; attributed: boolean } | null> {
  if (!salesMeasurementConfigured()) return null
  const order = paidOrderSchema.parse(unsafePayload)
  const externalEventId = `shopify:orders-paid:${webhookId}`
  const duplicate = await prisma.salesEvent.findUnique({
    where: { externalEventId },
    select: { sessionHash: true },
  })
  if (duplicate) {
    return {
      recorded: false,
      attributed: !duplicate.sessionHash.startsWith('unattributed:'),
    }
  }

  const orderHash = hashSalesIdentifier(String(order.id))
  const cartHash = order.cart_token
    ? hashSalesIdentifier(order.cart_token)
    : null
  const attribution = cartHash
    ? await prisma.checkoutAttribution.findFirst({
        where: { cartHash, expiresAt: { gt: new Date() } },
      })
    : null
  const sessionHash = attribution?.sessionHash ?? `unattributed:${orderHash}`
  const firstTouch = attribution
    ? await prisma.salesEvent.findFirst({
        where: { sessionHash },
        orderBy: { createdAt: 'asc' },
        select: { source: true, medium: true, campaign: true },
      })
    : null
  const source = firstTouch?.source ?? 'unattributed'
  const medium = firstTouch?.medium ?? 'none'
  const campaign = firstTouch?.campaign ?? 'none'
  const total = safeMoney(order.current_total_price ?? order.total_price)

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.salesEvent.create({
      data: {
        eventType: 'purchase',
        sessionHash,
        source,
        medium,
        campaign,
        value: total,
        currency: order.currency.toUpperCase(),
        externalEventId,
        evidenceSource: 'shopify:orders/paid:hmac-verified',
      },
    }),
  ]
  order.line_items.forEach((line, index) => {
    if (line.product_id == null) return
    operations.push(
      prisma.salesEvent.create({
        data: {
          eventType: 'purchase_item',
          sessionHash,
          productId: String(line.product_id),
          variantId: line.variant_id == null ? null : String(line.variant_id),
          source,
          medium,
          campaign,
          value: safeMoney(line.price) * line.quantity,
          currency: order.currency.toUpperCase(),
          externalEventId: `${externalEventId}:item:${index}`,
          evidenceSource: 'shopify:orders/paid:hmac-verified:line-item',
        },
      }),
    )
  })
  try {
    await prisma.$transaction(operations)
    return { recorded: true, attributed: Boolean(attribution) }
  } catch (error) {
    // Concurrent webhook deliveries can race before the first insert commits.
    // The unique event ID still guarantees one purchase; report the retry as a duplicate.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return { recorded: false, attributed: Boolean(attribution) }
    }
    throw error
  }
}

export async function exportSalesEvents(since: Date) {
  const rows = await prisma.salesEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 10_000,
  })
  return rows.map((row) => ({
    event_type: row.eventType,
    observed_at: row.createdAt.toISOString(),
    session_id: row.sessionHash,
    anonymous_id: `anon-${row.sessionHash.slice(0, 24)}`,
    product_id: row.productId ?? undefined,
    variant_id: row.variantId ?? undefined,
    value: row.value == null ? 0 : Number(row.value),
    gross_margin: null,
    currency: row.currency ?? 'USD',
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    properties:
      row.experimentId && row.experimentVariant
        ? {
            experiment_id: row.experimentId,
            variant: row.experimentVariant,
          }
        : {},
    idempotency_key: `hv-${row.id}`,
  }))
}
