import Image from 'next/image'
import { cn } from '@/lib/cn'

/**
 * Brand wordmark — single source of truth for "HV Jewelers" branding
 * across the header, footer, and mobile menu drawer. Renders the
 * olive-on-parchment monogram from /public/brand/wordmark.png with a
 * serif text fallback if the asset is removed.
 */

const LOGO_SRC = '/brand/wordmark.png'
const LOGO_SIZE = 1024 // square asset

const SIZE_TO_HEIGHT: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12 md:h-14 md:w-14',
  lg: 'h-20 w-20 md:h-24 md:w-24',
}

const SIZE_TO_TEXT: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-title',
  md: 'text-title md:text-display',
  lg: 'text-display',
}

export function Brand({
  size = 'md',
  className,
  showSubtitle = false,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSubtitle?: boolean
}) {
  const dims = SIZE_TO_HEIGHT[size]
  const text = SIZE_TO_TEXT[size]

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      {LOGO_SRC ? (
        <Image
          src={LOGO_SRC}
          alt="HV Jewelers"
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          priority
          className={cn('block object-contain', dims)}
        />
      ) : (
        <span className={cn('font-serif leading-none tracking-tight text-ink', text)}>
          HV Jewelers
        </span>
      )}
      {showSubtitle ? (
        <span className="hidden text-eyebrow text-ink-muted md:inline">
          Hoang Vi · Jewelers
        </span>
      ) : null}
    </span>
  )
}
