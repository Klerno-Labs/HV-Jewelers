'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, useInView, useTransform } from 'motion/react'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'
import {
  ScrollStage,
  useStageProgress,
} from '@/components/immersive/scroll-stage'
import { cn } from '@/lib/cn'

/**
 * HeroStage — the scroll choreography of the homepage hero.
 *
 * A 320vh ScrollStage with three beats:
 *  1. 0→~0.35  intro copy (h1 + CTAs) fades and lifts away
 *  2. ~0.42→0.85  the reveal caption holds center stage
 *  3. throughout  a parchment "clarity" layer brightens over the haze
 *
 * The 3D scene is dynamically loaded (ssr: false) so three.js never
 * blocks first paint; until it arrives — or when WebGL is missing —
 * the CSS haze ground keeps the composition intact.
 *
 * Copy is rendered inside this client component but still arrives in
 * the server HTML (client components SSR), so SEO/a11y see the h1.
 */

const HeroScene = dynamic(() => import('./hero-scene'), {
  ssr: false,
  loading: () => null,
})

export function HeroStage() {
  return (
    <ScrollStage heightVh={320}>
      <HeroStageContent />
    </ScrollStage>
  )
}

function HeroStageContent() {
  const progress = useStageProgress()
  const viewRef = useRef<HTMLDivElement>(null)
  // Suspend the WebGL loop entirely once the sticky stage has left
  // the viewport — scrolling the rest of the page costs zero GPU.
  const inView = useInView(viewRef, { margin: '20% 0px 20% 0px' })

  const copyOpacity = useTransform(progress, [0, 0.35], [1, 0])
  const copyY = useTransform(progress, [0, 0.5], [0, -60])
  // Once the intro copy has faded out, drop it from the tab order and
  // accessibility tree — invisible links must not be focusable.
  const copyVisibility = useTransform(copyOpacity, (v) =>
    v < 0.03 ? ('hidden' as const) : ('visible' as const),
  )
  const revealOpacity = useTransform(
    progress,
    [0.42, 0.62, 0.85, 0.97],
    [0, 1, 1, 0],
  )
  const clarity = useTransform(progress, [0, 1], [0, 1])
  const cueOpacity = useTransform(progress, [0, 0.18], [1, 0])

  return (
    <div ref={viewRef} className="relative h-full">
      {/* haze ground (also the no-WebGL fallback visual) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_70%_30%,var(--color-parchment-warm)_0%,var(--color-limestone-deep)_70%)]"
      />
      {/* clarity layer brightening with scroll */}
      <motion.div
        aria-hidden
        style={{ opacity: clarity }}
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_60%_40%,#f6efdd_0%,var(--color-parchment)_75%)]"
      />

      <div aria-hidden className="absolute inset-0">
        <HeroScene progress={progress} active={inView} />
      </div>

      {/* beat 1 — intro copy */}
      <motion.div
        style={{ opacity: copyOpacity, y: copyY, visibility: copyVisibility }}
        className="pointer-events-none absolute inset-0 flex flex-col justify-end pb-[11vh]"
      >
        <Container>
          <p className="text-eyebrow text-bronze">Hoang Vi Jewelers · Est. 2005</p>
          <h1
            id="intro-heading"
            className="mt-7 max-w-[16ch] font-serif text-display-lg font-light italic leading-[1.02] text-ink"
          >
            Fine jewelry, ready to wear.
          </h1>
          <p className="mt-7 max-w-xl text-subtitle leading-relaxed text-ink-soft">
            Gold chains, necklaces, bracelets, earrings, and pendants —
            finished pieces, one of each, shipped to your door. A family
            jeweler since 2005.
          </p>
          <div className="pointer-events-auto mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: 'primary', size: 'lg' }))}
            >
              Shop the collection
            </Link>
            <Link
              href="/about"
              className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }))}
            >
              About us →
            </Link>
          </div>
        </Container>
      </motion.div>

      {/* beat 2 — mid-scroll reveal. The static opacity-0 class keeps
          it hidden pre-hydration (the CSP strips SSR'd style attrs);
          motion drives element.style after hydration, which wins over
          the class. */}
      <motion.div
        style={{ opacity: revealOpacity }}
        className="pointer-events-none absolute inset-0 grid place-items-center text-center opacity-0"
      >
        <div>
          <p className="text-eyebrow text-bronze">Since 2005</p>
          <p className="mx-auto mt-5 max-w-[22ch] font-serif text-display font-light italic leading-[1.1] text-ink">
            Two decades behind the counter. Now shipped to your door.
          </p>
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        aria-hidden
        style={{ opacity: cueOpacity }}
        className="absolute bottom-9 right-10 hidden items-center gap-3 text-eyebrow text-ink-muted md:flex"
      >
        <span>Scroll</span>
        <span className="relative h-11 w-px overflow-hidden bg-ink-muted/40">
          <span className="absolute inset-x-0 top-0 h-full animate-pulse bg-bronze" />
        </span>
      </motion.div>
    </div>
  )
}
