import { formatPrice } from '@/lib/store/format'
import { cn } from '@/lib/cn'

export function Price({
  cents,
  currency = 'USD',
  className,
}: {
  cents: number
  currency?: string
  className?: string
}) {
  return (
    <span className={cn('tabular-nums', className)}>
      {formatPrice(cents, currency)}
    </span>
  )
}

export function PricePair({
  cents,
  compareAtCents,
  currency = 'USD',
  className,
}: {
  cents: number
  compareAtCents?: number | null
  currency?: string
  className?: string
}) {
  return (
    <span className={cn('tabular-nums', className)}>
      {compareAtCents && compareAtCents > cents ? (
        <>
          <span className="text-ink-muted line-through decoration-bronze/50 mr-3">
            {formatPrice(compareAtCents, currency)}
          </span>
          {formatPrice(cents, currency)}
        </>
      ) : (
        formatPrice(cents, currency)
      )}
    </span>
  )
}
