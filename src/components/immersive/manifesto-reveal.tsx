'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/cn'

/**
 * ManifestoReveal — the house statement, inked in line by line as the
 * section scrolls through the viewport. Replaces the static Manifesto
 * on the home page; copy is unchanged.
 *
 * Lines never drop below 0.14 opacity, so the block reads fine with
 * JS disabled (SSR ships full markup) and under reduced motion the
 * mapping still only responds to user scroll.
 */

const LINES: { text: string; headline?: boolean }[] = [
  { text: 'We’re small, and we’d rather stay that way.', headline: true },
  { text: 'Hoang Vi Jewelers has been a family jeweler since 2005.' },
  {
    text: 'We keep a tight, considered selection of gold and fine jewelry — chains, necklaces, bracelets, earrings, and pendants.',
  },
  {
    text: 'We stock just one of each piece. When it’s gone, it’s gone.',
  },
  {
    text: 'Each is finished, photographed, and checked by hand before it goes on the site, then shipped to your door.',
  },
]

function Line({
  line,
  index,
  progress,
}: {
  line: (typeof LINES)[number]
  index: number
  progress: MotionValue<number>
}) {
  const step = 1 / (LINES.length + 1)
  const opacity = useTransform(
    progress,
    [index * step, (index + 1.4) * step],
    [0.14, 1],
  )

  return (
    <motion.p
      style={{ opacity }}
      className={cn(
        line.headline
          ? 'font-serif text-display font-light italic text-ink'
          : 'mt-6 text-subtitle leading-relaxed text-ink-soft',
      )}
    >
      {line.text}
    </motion.p>
  )
}

export function ManifestoReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.55'],
  })

  return (
    <section
      ref={ref}
      aria-label="About the house"
      className="border-y border-limestone-deep/60 bg-parchment"
    >
      <Container className="py-28 md:py-40" width="reading">
        <p className="text-eyebrow text-bronze">About the house</p>
        <div className="mt-12">
          {LINES.map((line, i) => (
            <Line key={line.text} line={line} index={i} progress={scrollYProgress} />
          ))}
        </div>
      </Container>
    </section>
  )
}
