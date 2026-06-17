'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Site-wide smooth scrolling via Lenis. Renders children untouched and
 * only enhances scrolling on the client, so server markup and streaming
 * are unaffected.
 *
 * Constraints (per the immersive-redesign plan):
 *  - Never hijacks native scrolling: `syncTouch` stays false so mobile
 *    momentum scrolling remains the platform's own.
 *  - Honors `prefers-reduced-motion` by not instantiating Lenis at all.
 *  - Cleans up its rAF loop and instance on unmount (relevant for HMR
 *    and any future conditional mounting).
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
    })

    let frame = requestAnimationFrame(function loop(time: number) {
      lenis.raf(time)
      frame = requestAnimationFrame(loop)
    })

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
