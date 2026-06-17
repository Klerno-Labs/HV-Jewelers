'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { cn } from '@/lib/cn'

/**
 * ParallaxPlate — the imagery plate of a story panel. Two gradient
 * layers (and, from Phase 3, product photography) drift at different
 * rates as the plate crosses the viewport, giving the 2.5D depth from
 * the approved preview.
 *
 * Layers are oversized (-inset-[12%]) so the drift never exposes an
 * edge. Transforms are MotionValues — no re-renders on scroll. Under
 * reduced motion the drift still maps only to user scroll; the plate
 * is fully coherent at any static position.
 */
export function ParallaxPlate({
  layerA,
  layerB,
  captionLeft,
  captionRight,
  captionClassName,
  className,
  children,
}: {
  /// Tailwind background classes for the slow gradient layer.
  layerA: string
  /// Tailwind background classes for the faster accent layer.
  layerB: string
  captionLeft: string
  captionRight: string
  captionClassName?: string
  className?: string
  /// Optional content above the layers (e.g. product imagery, Phase 3).
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const yA = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])
  const yB = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])

  return (
    <div
      ref={ref}
      className={cn(
        'relative aspect-4/5 overflow-hidden shadow-[0_40px_80px_-30px_color-mix(in_srgb,var(--color-cedar)_45%,transparent)] lg:aspect-5/6',
        className,
      )}
    >
      <motion.div
        aria-hidden
        style={{ y: yA }}
        className={cn('absolute -inset-[12%]', layerA)}
      />
      <motion.div
        aria-hidden
        style={{ y: yB }}
        className={cn('absolute -inset-[12%]', layerB)}
      />
      {children}
      <div
        className={cn(
          'absolute bottom-5 left-5 right-5 flex items-baseline justify-between text-eyebrow',
          captionClassName ?? 'text-ink-muted',
        )}
      >
        <span>{captionLeft}</span>
        <span>{captionRight}</span>
      </div>
    </div>
  )
}
