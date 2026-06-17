'use client'

import dynamic from 'next/dynamic'
import { useTransform, motion } from 'motion/react'
import {
  ScrollStage,
  useStageProgress,
} from '@/components/immersive/scroll-stage'

/**
 * Phase 1 demo stage: ScrollStage + dynamically loaded R3F scene +
 * a motion-driven copy overlay. Lives on the internal /immersive
 * spec page; the Phase 2 hero replaces this with the real scene.
 */

const DemoScene = dynamic(() => import('./demo-scene'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="h-full w-full animate-pulse bg-[radial-gradient(ellipse_at_70%_30%,var(--color-parchment-warm)_0%,var(--color-limestone-deep)_70%)]"
    />
  ),
})

function StageContent() {
  const progress = useStageProgress()
  const introOpacity = useTransform(progress, [0, 0.35], [1, 0])
  const revealOpacity = useTransform(progress, [0.45, 0.65, 0.95], [0, 1, 1])

  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_30%,var(--color-parchment-warm)_0%,var(--color-limestone-deep)_70%)]" />
      <div className="absolute inset-0">
        <DemoScene progress={progress} />
      </div>
      <motion.div
        style={{ opacity: introOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-[12vh] text-center"
      >
        <p className="text-eyebrow text-bronze">Immersive infra demo</p>
        <p className="mt-4 font-serif text-display font-light italic text-ink">
          Scroll to drive the scene.
        </p>
      </motion.div>
      <motion.div
        style={{ opacity: revealOpacity }}
        className="pointer-events-none absolute inset-0 grid place-items-center text-center"
      >
        <div>
          <p className="text-eyebrow text-bronze">Stage progress → camera</p>
          <p className="mt-4 max-w-[22ch] font-serif text-display font-light italic text-ink">
            MotionValue read in useFrame, zero re-renders.
          </p>
        </div>
      </motion.div>
    </>
  )
}

export function DemoStage() {
  return (
    <ScrollStage heightVh={250}>
      <StageContent />
    </ScrollStage>
  )
}
