import { cn } from '@/lib/cn'

export type AvailabilityKind =
  | 'available'
  | 'last-one'
  | 'sold'
  | 'on-hold'
  | 'made-to-order'

export function AvailabilityPill({
  kind,
  className,
}: {
  kind: AvailabilityKind
  className?: string
}) {
  const COPY: Record<AvailabilityKind, { label: string; tone: string }> = {
    available: { label: 'In stock', tone: 'text-olive bg-olive/10' },
    'last-one': { label: 'One only', tone: 'text-bronze bg-bronze/10' },
    sold: { label: 'Sold', tone: 'text-cedar-deep bg-cedar/10' },
    'on-hold': { label: 'On hold', tone: 'text-cedar-soft bg-cedar/10' },
    'made-to-order': { label: 'Made to order', tone: 'text-bronze bg-bronze/10' },
  }
  const { label, tone } = COPY[kind]
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 text-eyebrow tracking-[0.18em]',
        tone,
        className,
      )}
    >
      {label}
    </span>
  )
}
