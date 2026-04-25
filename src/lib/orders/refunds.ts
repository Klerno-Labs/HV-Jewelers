import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/payments/stripe'
import { audit } from '@/lib/auth/audit'
import type { OpResult } from './fulfillment'

/**
 * Refund issuance. All refunds go through Stripe — we never touch money
 * outside the payment provider. Our DB tracks cumulative state and an
 * OrderEvent per refund so customer service can see the history.
 *
 * Flow:
 *   1. Validate order exists, is paid, and has a payment intent.
 *   2. Compute amount in cents, cap at remaining refundable.
 *   3. Call stripe.refunds.create({ payment_intent, amount, reason }).
 *   4. Increment totalRefundedCents; set status to REFUNDED (if full) or
 *      PARTIALLY_REFUNDED (if partial).
 *   5. Write OrderEvent and AuditLog rows.
 *
 * The internal reason enum maps to Stripe's narrower set.
 */

export type RefundReasonInternal =
  | 'DEFECTIVE'
  | 'NOT_AS_DESCRIBED'
  | 'NOT_RECEIVED'
  | 'OTHER'

function toStripeReason(
  internal: RefundReasonInternal,
): Stripe.RefundCreateParams.Reason | undefined {
  switch (internal) {
    case 'DEFECTIVE':
    case 'NOT_AS_DESCRIBED':
      // Stripe's `duplicate` / `fraudulent` don't fit; leave reason
      // unset but carry ours in metadata.
      return undefined
    case 'NOT_RECEIVED':
      return 'requested_by_customer'
    case 'OTHER':
    default:
      return 'requested_by_customer'
  }
}

export interface IssueRefundArgs {
  orderId: string
  amountCents: number
  reason: RefundReasonInternal
  note?: string | null
  actorId: string
  actorIp?: string | null
  actorUserAgent?: string | null
}

export async function issueRefund(args: IssueRefundArgs): Promise<OpResult<{
  refundId: string
  newTotalRefundedCents: number
}>> {
  if (args.amountCents <= 0) {
    return { ok: false, error: 'Refund amount must be greater than zero.' }
  }

  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalCents: true,
      totalRefundedCents: true,
      stripePaymentIntentId: true,
    },
  })

  if (!order) return { ok: false, error: 'Order not found.' }
  if (!order.stripePaymentIntentId) {
    return { ok: false, error: 'No Stripe payment intent on this order.' }
  }
  if (order.paymentStatus !== 'CAPTURED' && order.paymentStatus !== 'PARTIALLY_REFUNDED') {
    return { ok: false, error: 'Order is not in a refundable state.' }
  }

  const remaining = order.totalCents - order.totalRefundedCents
  if (remaining <= 0) {
    return { ok: false, error: 'Nothing left to refund on this order.' }
  }
  if (args.amountCents > remaining) {
    return {
      ok: false,
      error: `Amount exceeds refundable balance (${remaining} cents remaining).`,
    }
  }

  const stripe = getStripe()
  let refund: Stripe.Refund
  try {
    refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: args.amountCents,
      reason: toStripeReason(args.reason),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        internalReason: args.reason,
        actorId: args.actorId,
        ...(args.note ? { note: args.note.slice(0, 500) } : {}),
      },
    })
  } catch (err) {
    console.error('[refunds] Stripe refund failed', err)
    return { ok: false, error: 'Stripe refused the refund. See server logs.' }
  }

  const newTotalRefunded = order.totalRefundedCents + args.amountCents
  const isFull = newTotalRefunded >= order.totalCents

  await prisma.order.update({
    where: { id: order.id },
    data: {
      totalRefundedCents: newTotalRefunded,
      paymentStatus: isFull ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      status: isFull ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      refundedAt: isFull ? new Date() : undefined,
    },
  })

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      type: isFull ? 'REFUND_FULL' : 'REFUND_PARTIAL',
      description: `${isFull ? 'Full' : 'Partial'} refund · ${(
        args.amountCents / 100
      ).toFixed(2)} · ${args.reason}${args.note ? ` · ${args.note}` : ''}`,
      isCustomerVisible: true,
      actorId: args.actorId,
      context: {
        amountCents: args.amountCents,
        totalRefundedCents: newTotalRefunded,
        reason: args.reason,
        stripeRefundId: refund.id,
      },
    },
  })

  await audit({
    actorId: args.actorId,
    action: isFull ? 'order.refund.full' : 'order.refund.partial',
    resourceType: 'Order',
    resourceId: order.id,
    ip: args.actorIp,
    userAgent: args.actorUserAgent,
    context: {
      orderNumber: order.orderNumber,
      amountCents: args.amountCents,
      totalRefundedCents: newTotalRefunded,
      reason: args.reason,
      stripeRefundId: refund.id,
    },
  })

  // Notify the customer. Fail-soft: Stripe has already pushed the
  // refund, the DB is consistent — a failed email should not reverse
  // the refund.
  try {
    const full = await prisma.order.findUnique({ where: { id: order.id } })
    if (full) {
      const { sendOrderRefunded } = await import('@/lib/emails/send')
      await sendOrderRefunded(full, args.amountCents, {
        note: args.note ?? null,
        isFull,
      })
    }
  } catch (err) {
    console.error('[refunds] refund email threw', err)
  }

  return {
    ok: true,
    data: { refundId: refund.id, newTotalRefundedCents: newTotalRefunded },
  }
}
