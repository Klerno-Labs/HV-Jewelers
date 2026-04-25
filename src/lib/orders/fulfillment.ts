import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/auth/audit'

/**
 * Fulfillment operations — admin-invoked. Each mutation writes to both
 * OrderEvent (customer-facing timeline) and AuditLog (internal trail).
 *
 * State rules enforced here:
 *   • markShipped requires the order is PAID and not already SHIPPED.
 *   • markDelivered requires the order is SHIPPED.
 *   • updateTracking works on SHIPPED orders.
 *
 * We never flip status backwards. Stuck-status recovery must happen by
 * an ADMIN via the database directly (audited), never via a convenience
 * endpoint.
 */

export interface MarkShippedArgs {
  orderId: string
  trackingNumber: string
  carrier: string
  actorId: string
  actorIp?: string | null
  actorUserAgent?: string | null
  note?: string | null
}

export type OpResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function markShipped(args: MarkShippedArgs): Promise<OpResult> {
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: { id: true, status: true, orderNumber: true },
  })
  if (!order) return { ok: false, error: 'Order not found.' }
  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    return { ok: false, error: 'Order has already shipped.' }
  }
  if (order.status !== 'PAID') {
    return {
      ok: false,
      error: 'Only PAID orders can be marked shipped.',
    }
  }

  const now = new Date()

  await prisma.order.update({
    where: { id: args.orderId },
    data: {
      status: 'SHIPPED',
      fulfillmentStatus: 'SHIPPED',
      shippedAt: now,
      trackingNumber: args.trackingNumber,
      carrier: args.carrier,
    },
  })

  await prisma.orderEvent.create({
    data: {
      orderId: args.orderId,
      type: 'SHIPPED',
      description: `Shipped via ${args.carrier}${args.note ? ` — ${args.note}` : ''}.`,
      isCustomerVisible: true,
      actorId: args.actorId,
      context: { trackingNumber: args.trackingNumber, carrier: args.carrier },
    },
  })

  await audit({
    actorId: args.actorId,
    action: 'order.ship',
    resourceType: 'Order',
    resourceId: args.orderId,
    ip: args.actorIp,
    userAgent: args.actorUserAgent,
    context: {
      orderNumber: order.orderNumber,
      trackingNumber: args.trackingNumber,
      carrier: args.carrier,
    },
  })

  // Notify the customer. Fail-soft.
  try {
    const full = await prisma.order.findUnique({ where: { id: args.orderId } })
    if (full) {
      const { sendOrderShipped } = await import('@/lib/emails/send')
      const { buildTrackingUrl } = await import('@/lib/shipping/tracking')
      await sendOrderShipped(
        full,
        buildTrackingUrl(args.carrier, args.trackingNumber),
      )
    }
  } catch (err) {
    console.error('[fulfillment] shipped email threw', err)
  }

  return { ok: true }
}

export async function markDelivered(args: {
  orderId: string
  actorId: string
  actorIp?: string | null
  actorUserAgent?: string | null
}): Promise<OpResult> {
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: { id: true, status: true, orderNumber: true },
  })
  if (!order) return { ok: false, error: 'Order not found.' }
  if (order.status !== 'SHIPPED') {
    return { ok: false, error: 'Only SHIPPED orders can be marked delivered.' }
  }

  const now = new Date()

  await prisma.order.update({
    where: { id: args.orderId },
    data: {
      status: 'DELIVERED',
      fulfillmentStatus: 'DELIVERED',
      deliveredAt: now,
    },
  })

  await prisma.orderEvent.create({
    data: {
      orderId: args.orderId,
      type: 'DELIVERED',
      description: 'Package marked delivered.',
      isCustomerVisible: true,
      actorId: args.actorId,
    },
  })

  await audit({
    actorId: args.actorId,
    action: 'order.delivered',
    resourceType: 'Order',
    resourceId: args.orderId,
    ip: args.actorIp,
    userAgent: args.actorUserAgent,
    context: { orderNumber: order.orderNumber },
  })

  return { ok: true }
}

export async function updateInternalNote(args: {
  orderId: string
  note: string
  actorId: string
  actorIp?: string | null
  actorUserAgent?: string | null
}): Promise<OpResult> {
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: { id: true, internalNote: true, orderNumber: true },
  })
  if (!order) return { ok: false, error: 'Order not found.' }

  await prisma.order.update({
    where: { id: args.orderId },
    data: { internalNote: args.note || null },
  })

  await audit({
    actorId: args.actorId,
    action: 'order.note.update',
    resourceType: 'Order',
    resourceId: args.orderId,
    ip: args.actorIp,
    userAgent: args.actorUserAgent,
    before: order.internalNote ? { note: order.internalNote } : undefined,
    after: args.note ? { note: args.note } : undefined,
    context: { orderNumber: order.orderNumber },
  })

  return { ok: true }
}
