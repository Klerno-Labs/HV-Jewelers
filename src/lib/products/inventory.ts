import { Prisma, type InventoryItem } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Inventory operations. Per-unit tracking with status + ledger.
 *
 * Concurrency model:
 *   Every state transition is a conditional UPDATE that requires the
 *   current status to match an expected value. Two cart sessions racing
 *   to reserve the same one-of-one piece will see exactly one succeed
 *   (rowsAffected=1) and the other fail (rowsAffected=0). Always pair
 *   with a ledger entry inside the same transaction.
 */

const DEFAULT_RESERVATION_MS = 15 * 60 * 1000 // 15 minutes

export type ReservationOutcome =
  | { ok: true; item: InventoryItem }
  | { ok: false; reason: 'no_stock' | 'race_lost' | 'product_inactive' }

/**
 * Atomically reserve any AVAILABLE InventoryItem for the given product to
 * the given cart. Returns the reserved item or a structured failure.
 *
 * Implementation: a single UPDATE WHERE picks one row matching
 * (productId, status='AVAILABLE') and flips it to RESERVED. If no row
 * matches, the product is out of stock or in a race with another buyer.
 */
export async function reserveOneForCart(args: {
  productId: string
  cartId: string
  ttlMs?: number
  actorId?: string | null
}): Promise<ReservationOutcome> {
  const { productId, cartId, ttlMs = DEFAULT_RESERVATION_MS, actorId } = args
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMs)

  return prisma.$transaction(async (tx) => {
    // Pick one available item via a raw UPDATE so we get atomicity even
    // under heavy contention. RETURNING gives us the row we won.
    const rows = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        UPDATE "InventoryItem"
        SET "status" = 'RESERVED',
            "reservedCartId" = ${cartId},
            "reservedAt" = ${now},
            "reservedExpiresAt" = ${expiresAt},
            "updatedAt" = ${now}
        WHERE "id" = (
          SELECT "id" FROM "InventoryItem"
          WHERE "productId" = ${productId} AND "status" = 'AVAILABLE'
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING "id"
      `,
    )

    if (rows.length === 0) {
      return { ok: false, reason: 'no_stock' as const }
    }

    const id = rows[0]!.id
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id } })

    await tx.inventoryLedger.create({
      data: {
        inventoryItemId: id,
        event: 'RESERVED',
        fromStatus: 'AVAILABLE',
        toStatus: 'RESERVED',
        actorId: actorId ?? null,
        reason: 'cart.reserve',
        context: { cartId, expiresAt: expiresAt.toISOString() },
      },
    })

    return { ok: true, item }
  })
}

/**
 * Release a single reservation back to AVAILABLE. Idempotent: returns
 * false if the item was no longer reserved to the given cart (e.g.,
 * already released, expired, or sold).
 */
export async function releaseReservation(args: {
  inventoryItemId: string
  cartId: string
  actorId?: string | null
  reason?: string
}): Promise<boolean> {
  const { inventoryItemId, cartId, actorId, reason } = args
  return prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.updateMany({
      where: {
        id: inventoryItemId,
        status: 'RESERVED',
        reservedCartId: cartId,
      },
      data: {
        status: 'AVAILABLE',
        reservedCartId: null,
        reservedAt: null,
        reservedExpiresAt: null,
      },
    })
    if (updated.count === 0) return false

    await tx.inventoryLedger.create({
      data: {
        inventoryItemId,
        event: 'RESERVATION_RELEASED',
        fromStatus: 'RESERVED',
        toStatus: 'AVAILABLE',
        actorId: actorId ?? null,
        reason: reason ?? 'cart.release',
        context: { cartId },
      },
    })
    return true
  })
}

/**
 * Convert a reservation into a sale. Called from the Stripe webhook
 * after a successful checkout. Idempotent on `orderLineId`.
 */
export async function markSold(args: {
  inventoryItemId: string
  orderLineId: string
  actorId?: string | null
}): Promise<boolean> {
  const { inventoryItemId, orderLineId, actorId } = args
  const now = new Date()
  return prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.updateMany({
      where: {
        id: inventoryItemId,
        status: 'RESERVED',
      },
      data: {
        status: 'SOLD',
        soldAt: now,
        reservedCartId: null,
        reservedAt: null,
        reservedExpiresAt: null,
      },
    })
    if (updated.count === 0) return false

    await tx.inventoryLedger.create({
      data: {
        inventoryItemId,
        event: 'SOLD',
        fromStatus: 'RESERVED',
        toStatus: 'SOLD',
        actorId: actorId ?? null,
        reason: 'order.paid',
        context: { orderLineId },
      },
    })
    return true
  })
}

/**
 * Release a RESERVED inventory item back to AVAILABLE without requiring a
 * cart id. Intended for order cancellation paths where the cart has
 * already been converted or abandoned. The `WHERE status='RESERVED'`
 * guard prevents flipping a SOLD or AVAILABLE item back; idempotent.
 */
export async function releaseIfReserved(args: {
  inventoryItemId: string
  actorId?: string | null
  reason?: string
}): Promise<boolean> {
  const { inventoryItemId, actorId, reason } = args
  return prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.updateMany({
      where: {
        id: inventoryItemId,
        status: 'RESERVED',
      },
      data: {
        status: 'AVAILABLE',
        reservedCartId: null,
        reservedAt: null,
        reservedExpiresAt: null,
      },
    })
    if (updated.count === 0) return false

    await tx.inventoryLedger.create({
      data: {
        inventoryItemId,
        event: 'RESERVATION_RELEASED',
        fromStatus: 'RESERVED',
        toStatus: 'AVAILABLE',
        actorId: actorId ?? null,
        reason: reason ?? 'order.release',
      },
    })
    return true
  })
}

/**
 * Extend the reservation TTL on an already-RESERVED inventory item.
 * Used during the checkout entry handshake so reservations don't expire
 * while the customer is on Stripe.
 */
export async function extendReservation(args: {
  inventoryItemId: string
  cartId: string
  newExpiresAt: Date
}): Promise<boolean> {
  const { inventoryItemId, cartId, newExpiresAt } = args
  const result = await prisma.inventoryItem.updateMany({
    where: {
      id: inventoryItemId,
      status: 'RESERVED',
      reservedCartId: cartId,
    },
    data: { reservedExpiresAt: newExpiresAt },
  })
  return result.count > 0
}

/**
 * Sweep expired reservations. Run on a cron (every minute is fine).
 * Returns the number of items released.
 */
export async function sweepExpiredReservations(now: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const expired = await tx.inventoryItem.findMany({
      where: {
        status: 'RESERVED',
        reservedExpiresAt: { lt: now },
      },
      select: { id: true, reservedCartId: true },
    })
    if (expired.length === 0) return 0

    await tx.inventoryItem.updateMany({
      where: { id: { in: expired.map((e) => e.id) } },
      data: {
        status: 'AVAILABLE',
        reservedCartId: null,
        reservedAt: null,
        reservedExpiresAt: null,
      },
    })

    await tx.inventoryLedger.createMany({
      data: expired.map((e) => ({
        inventoryItemId: e.id,
        event: 'RESERVATION_EXPIRED' as const,
        fromStatus: 'RESERVED' as const,
        toStatus: 'AVAILABLE' as const,
        reason: 'cron.expire',
        context: { cartId: e.reservedCartId } as Prisma.InputJsonValue,
      })),
    })
    return expired.length
  })
}

/**
 * Count of available units for a product. Drives the storefront's "in
 * stock / 1 left / sold out" copy. Cheap because of the (productId,
 * status) compound index.
 */
export async function availableCount(productId: string) {
  return prisma.inventoryItem.count({
    where: { productId, status: 'AVAILABLE' },
  })
}
