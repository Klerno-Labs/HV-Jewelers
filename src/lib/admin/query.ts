import { z } from 'zod'
import type {
  InventoryStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client'

/**
 * Admin query helpers — parse URL searchParams for list pages. Zod
 * whitelists everything so unknown values cannot control Prisma queries.
 */

export const ORDER_PAGE_SIZE = 25
export const INVENTORY_PAGE_SIZE = 50

const orderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
])

const inventoryStatusSchema = z.enum([
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'DAMAGED',
  'HOLD',
  'RETURNED',
])

const ordersFiltersSchema = z.object({
  status: orderStatusSchema.optional(),
  q: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
})

export type OrdersFilters = z.infer<typeof ordersFiltersSchema>

export function parseOrdersFilters(
  searchParams: Record<string, string | string[] | undefined>,
): OrdersFilters {
  const flat: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(searchParams)) {
    flat[k] = Array.isArray(v) ? v[0] : v
  }
  const result = ordersFiltersSchema.safeParse(flat)
  return result.success ? result.data : { page: 1 }
}

export function ordersWhereFromFilters(f: OrdersFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {}
  if (f.status) where.status = f.status
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: f.from } : {}),
      ...(f.to ? { lte: endOfDay(f.to) } : {}),
    }
  }
  if (f.q) {
    where.OR = [
      { orderNumber: { contains: f.q, mode: 'insensitive' } },
      { email: { contains: f.q, mode: 'insensitive' } },
    ]
  }
  return where
}

function endOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(23, 59, 59, 999)
  return copy
}

// ─────────────────────────────────────────────────────────────────────
//  Inventory filters
// ─────────────────────────────────────────────────────────────────────

const inventoryFiltersSchema = z.object({
  status: inventoryStatusSchema.optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
})

export type InventoryFilters = z.infer<typeof inventoryFiltersSchema>

export function parseInventoryFilters(
  searchParams: Record<string, string | string[] | undefined>,
): InventoryFilters {
  const flat: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(searchParams)) {
    flat[k] = Array.isArray(v) ? v[0] : v
  }
  const result = inventoryFiltersSchema.safeParse(flat)
  return result.success ? result.data : { page: 1 }
}

export function inventoryWhereFromFilters(
  f: InventoryFilters,
): Prisma.InventoryItemWhereInput {
  const where: Prisma.InventoryItemWhereInput = {}
  if (f.status) where.status = f.status
  if (f.q) {
    where.OR = [
      { sku: { contains: f.q, mode: 'insensitive' } },
      { internalRef: { contains: f.q, mode: 'insensitive' } },
      { product: { title: { contains: f.q, mode: 'insensitive' } } },
      { product: { slug: { contains: f.q, mode: 'insensitive' } } },
    ]
  }
  return where
}

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partial refund' },
]

export const INVENTORY_STATUS_OPTIONS: Array<{ value: InventoryStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'HOLD', label: 'Held' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'RETURNED', label: 'Returned' },
]
