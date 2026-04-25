import type {
  FulfillmentStatus,
  InventoryStatus,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client'
import { cn } from '@/lib/cn'

/**
 * Admin-only status pills. Phase Colors revision: re-toned to the Greek
 * palette while keeping semantics legible — teal for "good," terracotta
 * for "in motion," murex for "attention," temple-stone for "neutral,"
 * ink for terminal "sold." Background opacity stays at 10–20% so pills
 * read as labels, not buttons.
 */

const BASE = 'inline-flex items-center px-2.5 py-1 text-eyebrow tracking-[0.18em]'

const ORDER: Record<OrderStatus, string> = {
  PENDING: 'bg-temple-stone text-ink',
  PAID: 'bg-greek-teal/15 text-greek-teal-deep',
  SHIPPED: 'bg-greek-terracotta/20 text-greek-terracotta-deep',
  DELIVERED: 'bg-greek-teal-deep/15 text-greek-teal-deep',
  CANCELLED: 'bg-murex-purple/15 text-murex-purple',
  REFUNDED: 'bg-murex-purple/10 text-murex-purple-soft',
  PARTIALLY_REFUNDED: 'bg-murex-purple/10 text-murex-purple-soft',
}

const PAYMENT: Record<PaymentStatus, string> = {
  PENDING: 'bg-temple-stone text-ink',
  AUTHORIZED: 'bg-greek-terracotta/15 text-greek-terracotta-deep',
  CAPTURED: 'bg-greek-teal/15 text-greek-teal-deep',
  FAILED: 'bg-murex-purple/15 text-murex-purple',
  REFUNDED: 'bg-murex-purple/10 text-murex-purple-soft',
  PARTIALLY_REFUNDED: 'bg-murex-purple/10 text-murex-purple-soft',
}

const FULFILLMENT: Record<FulfillmentStatus, string> = {
  UNFULFILLED: 'bg-temple-stone text-ink',
  PROCESSING: 'bg-greek-terracotta/15 text-greek-terracotta-deep',
  SHIPPED: 'bg-greek-terracotta/20 text-greek-terracotta-deep',
  IN_TRANSIT: 'bg-greek-terracotta/20 text-greek-terracotta-deep',
  DELIVERED: 'bg-greek-teal-deep/15 text-greek-teal-deep',
  RETURN_REQUESTED: 'bg-murex-purple/10 text-murex-purple-soft',
  RETURNED: 'bg-murex-purple/15 text-murex-purple',
  CANCELLED: 'bg-murex-purple/15 text-murex-purple',
}

const INVENTORY: Record<InventoryStatus, string> = {
  AVAILABLE: 'bg-greek-teal/15 text-greek-teal-deep',
  RESERVED: 'bg-greek-terracotta/20 text-greek-terracotta-deep',
  SOLD: 'bg-ink/10 text-ink',
  DAMAGED: 'bg-murex-purple/15 text-murex-purple',
  HOLD: 'bg-temple-stone text-ink',
  RETURNED: 'bg-murex-purple/10 text-murex-purple-soft',
}

const LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partial refund',
  AUTHORIZED: 'Authorized',
  CAPTURED: 'Captured',
  FAILED: 'Failed',
  UNFULFILLED: 'Unfulfilled',
  PROCESSING: 'Processing',
  IN_TRANSIT: 'In transit',
  RETURN_REQUESTED: 'Return requested',
  RETURNED: 'Returned',
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  DAMAGED: 'Damaged',
  HOLD: 'Held',
}

type PillKind = 'order' | 'payment' | 'fulfillment' | 'inventory'

export function StatusPill({
  kind,
  value,
  className,
}: {
  kind: PillKind
  value: string
  className?: string
}) {
  const map =
    kind === 'order'
      ? ORDER
      : kind === 'payment'
        ? PAYMENT
        : kind === 'fulfillment'
          ? FULFILLMENT
          : INVENTORY
  const tone = (map as Record<string, string>)[value] ?? 'bg-temple-stone text-ink'
  return (
    <span className={cn(BASE, tone, className)}>
      {LABELS[value] ?? value}
    </span>
  )
}
