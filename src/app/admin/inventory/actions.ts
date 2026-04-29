'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit, auditRequestContext } from '@/lib/auth/audit'
import { cuidSchema } from '@/lib/validation/common'

/**
 * Inventory bulk actions. All mutations write an InventoryLedger entry
 * and an AuditLog entry tagged with the actor. Bulk ops are atomic per
 * item — a failure on one does not roll back the others (they're
 * independent state transitions).
 */

const idsSchema = z.object({
  ids: z
    .string()
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(cuidSchema).min(1).max(200)),
})

function idsFromFormData(formData: FormData): string[] {
  const raw = formData.getAll('id').map((v) => String(v)).filter(Boolean)
  if (raw.length > 0) {
    return idsSchema.parse({ ids: raw.join(',') }).ids
  }
  const single = formData.get('ids')
  if (typeof single === 'string') {
    return idsSchema.parse({ ids: single }).ids
  }
  return []
}

function backToList() {
  return '/admin/inventory'
}

async function logBulk(
  actorId: string,
  ids: string[],
  action: string,
  extras: Prisma.InputJsonValue = {},
  ip: string | null,
  ua: string | null,
) {
  await audit({
    actorId,
    action,
    resourceType: 'InventoryItem',
    resourceId: null,
    ip,
    userAgent: ua,
    context: { ids, count: ids.length, ...(extras as object) },
  })
}

/**
 * Release RESERVED items back to AVAILABLE. Only acts on currently
 * RESERVED rows; never flips SOLD items back.
 */
export async function bulkReleaseAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const ids = idsFromFormData(formData)
  if (ids.length === 0) redirect(`${backToList()}?error=no_selection`)

  const ctx = await auditRequestContext()
  let released = 0
  for (const id of ids) {
    const updated = await prisma.inventoryItem.updateMany({
      where: { id, status: 'RESERVED' },
      data: {
        status: 'AVAILABLE',
        reservedCartId: null,
        reservedAt: null,
        reservedExpiresAt: null,
      },
    })
    if (updated.count > 0) {
      await prisma.inventoryLedger.create({
        data: {
          inventoryItemId: id,
          event: 'RESERVATION_RELEASED',
          fromStatus: 'RESERVED',
          toStatus: 'AVAILABLE',
          actorId: user.id,
          reason: 'admin.bulk.release',
        },
      })
      released++
    }
  }
  await logBulk(user.id, ids, 'inventory.bulk.release', { released }, ctx.ip, ctx.userAgent)

  revalidatePath('/admin/inventory')
  redirect(`${backToList()}?released=${released}`)
}

/**
 * Place items on admin HOLD — e.g., pulled for photography or
 * inspection. Only AVAILABLE items can be held (no stealing from a
 * customer's reservation or a sold piece).
 */
export async function bulkHoldAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const ids = idsFromFormData(formData)
  if (ids.length === 0) redirect(`${backToList()}?error=no_selection`)

  const ctx = await auditRequestContext()
  let held = 0
  for (const id of ids) {
    const updated = await prisma.inventoryItem.updateMany({
      where: { id, status: 'AVAILABLE' },
      data: { status: 'HOLD' },
    })
    if (updated.count > 0) {
      await prisma.inventoryLedger.create({
        data: {
          inventoryItemId: id,
          event: 'HELD',
          fromStatus: 'AVAILABLE',
          toStatus: 'HOLD',
          actorId: user.id,
          reason: 'admin.bulk.hold',
        },
      })
      held++
    }
  }
  await logBulk(user.id, ids, 'inventory.bulk.hold', { held }, ctx.ip, ctx.userAgent)

  revalidatePath('/admin/inventory')
  redirect(`${backToList()}?held=${held}`)
}

/**
 * Release an admin HOLD back to AVAILABLE. Only flips HOLD rows.
 */
export async function bulkUnholdAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const ids = idsFromFormData(formData)
  if (ids.length === 0) redirect(`${backToList()}?error=no_selection`)

  const ctx = await auditRequestContext()
  let released = 0
  for (const id of ids) {
    const updated = await prisma.inventoryItem.updateMany({
      where: { id, status: 'HOLD' },
      data: { status: 'AVAILABLE' },
    })
    if (updated.count > 0) {
      await prisma.inventoryLedger.create({
        data: {
          inventoryItemId: id,
          event: 'HELD_RELEASED',
          fromStatus: 'HOLD',
          toStatus: 'AVAILABLE',
          actorId: user.id,
          reason: 'admin.bulk.unhold',
        },
      })
      released++
    }
  }
  await logBulk(user.id, ids, 'inventory.bulk.unhold', { released }, ctx.ip, ctx.userAgent)

  revalidatePath('/admin/inventory')
  redirect(`${backToList()}?unheld=${released}`)
}

// ─── Single-item actions ──────────────────────────────────────────────

function detailUrl(id: string) {
  return `/admin/inventory/${id}`
}

export async function holdUnitAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect(backToList())
  const ctx = await auditRequestContext()

  const updated = await prisma.inventoryItem.updateMany({
    where: { id, status: 'AVAILABLE' },
    data: { status: 'HOLD' },
  })
  if (updated.count === 0) redirect(`${detailUrl(id)}?error=state`)

  await prisma.inventoryLedger.create({
    data: {
      inventoryItemId: id,
      event: 'HELD',
      fromStatus: 'AVAILABLE',
      toStatus: 'HOLD',
      actorId: user.id,
      reason: 'admin.hold',
    },
  })
  await audit({
    actorId: user.id, action: 'inventory.hold',
    resourceType: 'InventoryItem', resourceId: id,
    ip: ctx.ip, userAgent: ctx.userAgent,
  })
  revalidatePath('/admin/inventory')
  revalidatePath(detailUrl(id))
  redirect(`${detailUrl(id)}?held=1`)
}

export async function unholdUnitAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect(backToList())
  const ctx = await auditRequestContext()

  const updated = await prisma.inventoryItem.updateMany({
    where: { id, status: 'HOLD' },
    data: { status: 'AVAILABLE' },
  })
  if (updated.count === 0) redirect(`${detailUrl(id)}?error=state`)

  await prisma.inventoryLedger.create({
    data: {
      inventoryItemId: id,
      event: 'HELD_RELEASED',
      fromStatus: 'HOLD',
      toStatus: 'AVAILABLE',
      actorId: user.id,
      reason: 'admin.unhold',
    },
  })
  await audit({
    actorId: user.id, action: 'inventory.unhold',
    resourceType: 'InventoryItem', resourceId: id,
    ip: ctx.ip, userAgent: ctx.userAgent,
  })
  revalidatePath('/admin/inventory')
  revalidatePath(detailUrl(id))
  redirect(`${detailUrl(id)}?unheld=1`)
}

export async function releaseUnitAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect(backToList())
  const ctx = await auditRequestContext()

  const updated = await prisma.inventoryItem.updateMany({
    where: { id, status: 'RESERVED' },
    data: {
      status: 'AVAILABLE',
      reservedCartId: null,
      reservedAt: null,
      reservedExpiresAt: null,
    },
  })
  if (updated.count === 0) redirect(`${detailUrl(id)}?error=state`)

  await prisma.inventoryLedger.create({
    data: {
      inventoryItemId: id,
      event: 'RESERVATION_RELEASED',
      fromStatus: 'RESERVED',
      toStatus: 'AVAILABLE',
      actorId: user.id,
      reason: 'admin.release',
    },
  })
  await audit({
    actorId: user.id, action: 'inventory.release',
    resourceType: 'InventoryItem', resourceId: id,
    ip: ctx.ip, userAgent: ctx.userAgent,
  })
  revalidatePath('/admin/inventory')
  revalidatePath(detailUrl(id))
  redirect(`${detailUrl(id)}?released=1`)
}

export async function markDamagedUnitAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect(backToList())
  const ctx = await auditRequestContext()

  const previous = await prisma.inventoryItem.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!previous || (previous.status !== 'AVAILABLE' && previous.status !== 'HOLD')) {
    redirect(`${detailUrl(id)}?error=state`)
  }

  await prisma.inventoryItem.update({
    where: { id },
    data: { status: 'DAMAGED' },
  })
  await prisma.inventoryLedger.create({
    data: {
      inventoryItemId: id,
      event: 'DAMAGED',
      fromStatus: previous!.status,
      toStatus: 'DAMAGED',
      actorId: user.id,
      reason: 'admin.damaged',
    },
  })
  await audit({
    actorId: user.id, action: 'inventory.damaged',
    resourceType: 'InventoryItem', resourceId: id,
    ip: ctx.ip, userAgent: ctx.userAgent,
  })
  revalidatePath('/admin/inventory')
  revalidatePath(detailUrl(id))
  redirect(`${detailUrl(id)}?damaged=1`)
}

// ─── Create new unit from inventory list ──────────────────────────────

export async function createInventoryUnitAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const productId = String(formData.get('productId') ?? '')
  if (!productId) redirect(`${backToList()}?error=product`)

  const sku = String(formData.get('sku') ?? '').trim() || undefined
  const internalRef = String(formData.get('internalRef') ?? '').trim() || null
  const costRaw = formData.get('cost')
  let costCents: number | null = null
  if (costRaw && String(costRaw).trim()) {
    const n = parseFloat(String(costRaw))
    if (!isNaN(n)) costCents = Math.round(n * 100)
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  })
  if (!product) redirect(`${backToList()}?error=product`)

  const ctx = await auditRequestContext()

  try {
    const unit = await prisma.inventoryItem.create({
      data: { productId, sku, internalRef, costCents, status: 'AVAILABLE' },
    })
    await prisma.inventoryLedger.create({
      data: {
        inventoryItemId: unit.id,
        event: 'RECEIVED',
        fromStatus: null,
        toStatus: 'AVAILABLE',
        actorId: user.id,
        reason: 'admin.received',
      },
    })
    await audit({
      actorId: user.id, action: 'inventory.create',
      resourceType: 'InventoryItem', resourceId: unit.id,
      ip: ctx.ip, userAgent: ctx.userAgent,
      after: { productId, sku: unit.sku },
    })
    revalidatePath('/admin/inventory')
    redirect(`${detailUrl(unit.id)}?created=1`)
  } catch (err) {
    console.error('[inventory] create unit failed', err)
    redirect(`${backToList()}?error=sku`)
  }
}

/**
 * Mark items as DAMAGED. Works from AVAILABLE or HOLD. Does not touch
 * SOLD or RESERVED (those need the specific refund / release path).
 */
export async function bulkMarkDamagedAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const ids = idsFromFormData(formData)
  if (ids.length === 0) redirect(`${backToList()}?error=no_selection`)

  const ctx = await auditRequestContext()
  let marked = 0
  for (const id of ids) {
    const previous = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { status: true },
    })
    if (!previous || (previous.status !== 'AVAILABLE' && previous.status !== 'HOLD')) {
      continue
    }
    await prisma.inventoryItem.update({
      where: { id },
      data: { status: 'DAMAGED' },
    })
    await prisma.inventoryLedger.create({
      data: {
        inventoryItemId: id,
        event: 'DAMAGED',
        fromStatus: previous.status,
        toStatus: 'DAMAGED',
        actorId: user.id,
        reason: 'admin.bulk.damaged',
      },
    })
    marked++
  }
  await logBulk(user.id, ids, 'inventory.bulk.damaged', { marked }, ctx.ip, ctx.userAgent)

  revalidatePath('/admin/inventory')
  redirect(`${backToList()}?damaged=${marked}`)
}

