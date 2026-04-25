import type { NextRequest } from 'next/server'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { buildCsv, csvResponse } from '@/lib/admin/csv'
import {
  ordersWhereFromFilters,
  parseOrdersFilters,
} from '@/lib/admin/query'

/**
 * CSV export of orders matching the current filters. No row limit here —
 * if the catalog grows large enough to strain memory we can move to a
 * streamed response; today a few thousand orders fit comfortably.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  await requireStaffOrAdmin()

  const sp: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((v, k) => {
    sp[k] = v
  })
  const filters = parseOrdersFilters(sp)
  const where = ordersWhereFromFilters(filters)

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lines: true } } },
  })

  const headers = [
    'Order number',
    'Placed at',
    'Email',
    'Status',
    'Payment',
    'Fulfillment',
    'Currency',
    'Subtotal cents',
    'Shipping cents',
    'Tax cents',
    'Discount cents',
    'Total cents',
    'Refunded cents',
    'Ship name',
    'Ship line 1',
    'Ship city',
    'Ship region',
    'Ship postal',
    'Ship country',
    'Carrier',
    'Tracking',
    'Line count',
    'Stripe payment intent',
  ]

  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt.toISOString(),
    o.email,
    o.status,
    o.paymentStatus,
    o.fulfillmentStatus,
    o.currency,
    o.subtotalCents,
    o.shippingCents,
    o.taxCents,
    o.discountCents,
    o.totalCents,
    o.totalRefundedCents,
    o.shipName,
    o.shipLine1,
    o.shipCity,
    o.shipRegion,
    o.shipPostalCode,
    o.shipCountry,
    o.carrier ?? '',
    o.trackingNumber ?? '',
    o._count.lines,
    o.stripePaymentIntentId ?? '',
  ])

  const csv = buildCsv(headers, rows)
  const stamp = new Date().toISOString().slice(0, 10)
  return csvResponse(csv, `hv-orders-${stamp}.csv`)
}
