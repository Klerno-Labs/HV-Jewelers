'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireStaffOrAdmin, requireAdmin } from '@/lib/auth-helpers'
import { audit, auditRequestContext } from '@/lib/auth/audit'
import {
  markShipped,
  markDelivered,
  updateInternalNote,
} from '@/lib/orders/fulfillment'
import { issueRefund } from '@/lib/orders/refunds'
import { prisma } from '@/lib/prisma'
import {
  createLabel,
  isShippoConfigured,
  shipToFromOrder,
} from '@/lib/shipping/shippo'
import { cuidSchema, safeText } from '@/lib/validation/common'

const shipInput = z.object({
  orderId: cuidSchema,
  trackingNumber: z.string().trim().min(3).max(60),
  carrier: z.enum(['UPS', 'FEDEX', 'USPS', 'DHL', 'OTHER']),
  note: safeText.optional().nullable(),
})

const deliverInput = z.object({
  orderId: cuidSchema,
})

const refundInput = z.object({
  orderId: cuidSchema,
  amountCents: z.coerce.number().int().min(1).max(100_000_000),
  reason: z.enum(['DEFECTIVE', 'NOT_AS_DESCRIBED', 'NOT_RECEIVED', 'OTHER']),
  note: safeText.optional().nullable(),
})

const noteInput = z.object({
  orderId: cuidSchema,
  note: safeText.optional().nullable(),
})

function backToOrder(orderId: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  return `/admin/orders/${orderId}${qs ? `?${qs}` : ''}`
}

export async function shipOrderAction(formData: FormData) {
  // STAFF or ADMIN — both can ship.
  const { user } = await requireStaffOrAdmin()
  const parsed = shipInput.safeParse({
    orderId: formData.get('orderId'),
    trackingNumber: formData.get('trackingNumber'),
    carrier: formData.get('carrier'),
    note: formData.get('note') || null,
  })
  if (!parsed.success) {
    const id = String(formData.get('orderId') ?? '')
    redirect(backToOrder(id, { error: 'invalid' }))
  }
  const ctx = await auditRequestContext()
  const result = await markShipped({
    orderId: parsed.data.orderId,
    trackingNumber: parsed.data.trackingNumber,
    carrier: parsed.data.carrier,
    actorId: user.id,
    actorIp: ctx.ip,
    actorUserAgent: ctx.userAgent,
    note: parsed.data.note ?? null,
  })
  if (!result.ok) {
    redirect(
      backToOrder(parsed.data.orderId, {
        error: 'ship',
        msg: result.error,
      }),
    )
  }
  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  revalidatePath('/admin/orders')
  redirect(backToOrder(parsed.data.orderId, { shipped: '1' }))
}

export async function deliverOrderAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const parsed = deliverInput.safeParse({ orderId: formData.get('orderId') })
  if (!parsed.success) redirect('/admin/orders')
  const ctx = await auditRequestContext()
  const result = await markDelivered({
    orderId: parsed.data.orderId,
    actorId: user.id,
    actorIp: ctx.ip,
    actorUserAgent: ctx.userAgent,
  })
  if (!result.ok) {
    redirect(
      backToOrder(parsed.data.orderId, {
        error: 'deliver',
        msg: result.error,
      }),
    )
  }
  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  redirect(backToOrder(parsed.data.orderId, { delivered: '1' }))
}

export async function refundOrderAction(formData: FormData) {
  // Refunds: ADMIN-only per brief ("destructive operations" gated tighter).
  const { user } = await requireAdmin()
  const parsed = refundInput.safeParse({
    orderId: formData.get('orderId'),
    amountCents: formData.get('amountCents'),
    reason: formData.get('reason'),
    note: formData.get('note') || null,
  })
  if (!parsed.success) {
    const id = String(formData.get('orderId') ?? '')
    redirect(backToOrder(id, { error: 'refund_input' }))
  }
  const ctx = await auditRequestContext()
  const result = await issueRefund({
    orderId: parsed.data.orderId,
    amountCents: parsed.data.amountCents,
    reason: parsed.data.reason,
    note: parsed.data.note ?? null,
    actorId: user.id,
    actorIp: ctx.ip,
    actorUserAgent: ctx.userAgent,
  })
  if (!result.ok) {
    redirect(
      backToOrder(parsed.data.orderId, {
        error: 'refund',
        msg: result.error,
      }),
    )
  }
  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  revalidatePath('/admin/orders')
  redirect(backToOrder(parsed.data.orderId, { refunded: '1' }))
}

export async function updateNoteAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const parsed = noteInput.safeParse({
    orderId: formData.get('orderId'),
    note: formData.get('note') || null,
  })
  if (!parsed.success) {
    const id = String(formData.get('orderId') ?? '')
    redirect(backToOrder(id, { error: 'note' }))
  }
  const ctx = await auditRequestContext()
  await updateInternalNote({
    orderId: parsed.data.orderId,
    note: parsed.data.note ?? '',
    actorId: user.id,
    actorIp: ctx.ip,
    actorUserAgent: ctx.userAgent,
  })
  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  redirect(backToOrder(parsed.data.orderId, { note: '1' }))
}

/**
 * Generate a Shippo shipping label and auto-mark the order SHIPPED.
 * One button, one decision — picks the cheapest preferred carrier rate,
 * buys it, stores the label URL + tracking, and transitions the order.
 *
 * Falls through cleanly if Shippo isn't configured; the admin can
 * still fall back to the manual ship form.
 */
const labelInput = z.object({
  orderId: cuidSchema,
})

export async function generateLabelAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const parsed = labelInput.safeParse({ orderId: formData.get('orderId') })
  if (!parsed.success) redirect('/admin/orders')
  const orderId = parsed.data.orderId

  if (!isShippoConfigured()) {
    redirect(backToOrder(orderId, { error: 'ship', msg: 'Shippo is not configured.' }))
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      email: true,
      shipName: true,
      shipLine1: true,
      shipLine2: true,
      shipCity: true,
      shipRegion: true,
      shipPostalCode: true,
      shipCountry: true,
      shipPhone: true,
      signatureRequired: true,
    },
  })

  if (!order) redirect('/admin/orders')
  if (order.status !== 'PAID') {
    redirect(
      backToOrder(orderId, {
        error: 'ship',
        msg: 'Only PAID orders can have a label generated.',
      }),
    )
  }
  if (!order.shipLine1) {
    redirect(
      backToOrder(orderId, {
        error: 'ship',
        msg: 'Shipping address is not captured yet.',
      }),
    )
  }

  const ctx = await auditRequestContext()

  let label
  try {
    label = await createLabel({
      shipTo: shipToFromOrder(order),
      signatureRequired: order.signatureRequired,
    })
  } catch (err) {
    console.error('[orders/label] Shippo failed', err)
    redirect(
      backToOrder(orderId, {
        error: 'ship',
        msg: 'Shippo refused the shipment. Try the manual form.',
      }),
    )
  }

  // Persist the Shippo refs before the status transition, so a crash
  // between label purchase and status flip leaves us with the purchased
  // label recorded — staff can retry the transition without buying a
  // second label.
  await prisma.order.update({
    where: { id: orderId },
    data: {
      shippoTransactionId: label.transactionId,
      shippoLabelUrl: label.labelUrl,
    },
  })

  const result = await markShipped({
    orderId,
    trackingNumber: label.trackingNumber,
    carrier: label.carrier,
    actorId: user.id,
    actorIp: ctx.ip,
    actorUserAgent: ctx.userAgent,
    note: `Shippo rate ${label.rateAmountCents}¢ ${label.currency}`,
  })

  if (!result.ok) {
    // Label was purchased but status flip failed — log and surface.
    await audit({
      actorId: user.id,
      action: 'order.ship.partial',
      resourceType: 'Order',
      resourceId: orderId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      context: {
        shippoTransactionId: label.transactionId,
        reason: result.error,
      },
    })
    redirect(backToOrder(orderId, { error: 'ship', msg: result.error }))
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  redirect(backToOrder(orderId, { shipped: '1' }))
}
