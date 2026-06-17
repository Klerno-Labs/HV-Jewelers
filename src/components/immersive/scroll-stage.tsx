'use client'

import { createContext, useContext, useRef } from 'react'
import { useScroll, type MotionValue } from 'motion/react'
import { cn } from '@/lib/cn'

/**
 * ScrollStage — the core scroll-driven-scene primitive.
 *
 * Renders a tall scroll track (`heightVh`) with a sticky, viewport-height
 * inner stage. As the user scrolls through the track, `useStageProgress()`
 * exposes a 0→1 MotionValue that children (copy overlays, 3D scene
 * bridges) can map to camera moves, opacity, transforms, etc.
 *
 * The MotionValue updates outside the React render loop, so consumers
 * reading it in `useFrame` or motion `style` props never trigger
 * re-renders on scroll.
 */

const StageContext = createContext<MotionValue<number> | null>(null)

export function useStageProgress(): MotionValue<number> {
  const value = useContext(StageContext)
  if (!value) {
    throw new Error('useStageProgress must be used inside <ScrollStage>')
  }
  return value
}

/**
 * Track heights as static Tailwind classes — NOT an inline style.
 * The production CSP (nonce + strict style-src) strips SSR'd `style`
 * attributes, which silently collapses the track to content height
 * and disables the whole scroll choreography. Same pattern as
 * FadeIn's DELAY_CLASS. Add entries here when a new stage length is
 * needed; arbitrary-value classes compile because they appear as
 * literals in the source.
 */
const HEIGHT_CLASS = {
  250: 'h-[250vh]',
  320: 'h-[320vh]',
} as const

export function ScrollStage({
  heightVh = 320,
  className,
  stageClassName,
  children,
}: {
  /// Total scroll distance of the track, in viewport-height units.
  heightVh?: keyof typeof HEIGHT_CLASS
  className?: string
  /// Extra classes for the sticky stage (e.g. background treatments).
  stageClassName?: string
  children: React.ReactNode
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  return (
    <div
      ref={trackRef}
      className={cn('relative', HEIGHT_CLASS[heightVh], className)}
    >
      <div
        className={cn('sticky top-0 h-dvh overflow-hidden', stageClassName)}
      >
        <StageContext.Provider value={scrollYProgress}>
          {children}
        </StageContext.Provider>
      </div>
    </div>
  )
}
