import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron/auth'
import { prisma } from '@/lib/prisma'
import { releaseIfReserved } from '@/lib/products/inventory'

/**
 * Cancel PENDING orders older than two hours and release any inventory
 * reservations they still hold.
 *
 * We complement — not replace — Stripe's `checkout.session.expired`
 * webhook: if Stripe delivery ever lags or the webhook endpoint was
 * down during the expiry moment, this sweep cleans up the orphan.
 *
 * Runs hourly via Vercel Cron.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STALE_PENDING_MS = 2 * 60 * 60 * 1000 // 2 hours

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - STALE_PENDING_MS)
    const stale = await prisma.order.findMany({
      where: { status: 'PENDING', createdAt: { lt: cutoff } },
      select: {
        id: true,
        orderNumber: true,
        lines: { select: { inventoryItemId: true } },
      },
    })

    let cancelled = 0
    let released = 0

    for (const order of stale) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      })
      cancelled++

      for (const line of order.lines) {
        if (line.inventoryItemId) {
          const ok = await releaseIfReserved({
            inventoryItemId: line.inventoryItemId,
            reason: 'cron.sweep-pending',
          })
          if (ok) released++
        }
      }

      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'CANCELLED',
          description: `Cancelled by sweep after ${Math.floor(STALE_PENDING_MS / 3600_000)}h in PENDING.`,
          isCustomerVisible: false,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      cancelled,
      releasedInventoryItems: released,
    })
  } catch (err) {
    console.error('[cron/sweep-pending-orders] failed', err)
    return NextResponse.json({ error: 'sweep failed' }, { status: 500 })
  }
}
