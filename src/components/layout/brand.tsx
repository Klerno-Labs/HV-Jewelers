import Image from 'next/image'
import { cn } from '@/lib/cn'

/**
 * Brand wordmark — single source of truth for "HV Jewelers" branding
 * across the header, footer, and mobile menu drawer. When a logo PNG/SVG
 * exists at /public/brand/wordmark.{png,svg}, swap the LOGO_SRC below
 * to use it; until then the serif text wordmark stands in.
 *
 * The text and image variants share the same outer span so layout
 * stays stable across the swap.
 */

const LOGO_SRC: string | null = null
const LOGO_WIDTH = 200
const LOGO_HEIGHT = 48

export function Brand({
  size = 'md',
  className,
  showSubtitle = false,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSubtitle?: boolean
}) {
  const sizeClass =
    size === 'sm' ? 'text-title' : size === 'lg' ? 'text-display' : 'text-title md:text-display'

  return (
    <span className={cn('inline-flex items-baseline gap-3', className)}>
      {LOGO_SRC ? (
        <Image
          src={LOGO_SRC}
          alt="HV Jewelers"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          priority
          className="h-8 w-auto md:h-10"
        />
      ) : (
        <span
          className={cn(
            'font-serif leading-none tracking-tight text-ink',
            sizeClass,
          )}
        >
          HV Jewelers
        </span>
      )}
      {showSubtitle ? (
        <span className="hidden text-eyebrow text-ink-muted md:inline">
          Hoang Vi
        </span>
      ) : null}
    </span>
  )
}
