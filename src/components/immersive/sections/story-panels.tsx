import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { ParallaxPlate } from '@/components/immersive/parallax-plate'
import { FadeIn } from '@/components/store/fade-in'

/**
 * StoryPanels — scroll-driven brand narrative (01 Solid Gold,
 * 02 Fine Jewelry), each followed in the page by a live product row.
 *
 * Copy enters via the existing FadeIn primitive; the plate is a
 * client ParallaxPlate with two gradient layers drifting at different
 * rates. Phase 3 threads real product photography into the plates via
 * ParallaxPlate's children slot.
 */

export interface StoryPanelContent {
  index: string
  eyebrow: string
  title: string
  body: string
  href: string
  ctaLabel: string
  captionLeft: string
  captionRight: string
  /// Tailwind background classes for the plate's two parallax layers.
  layerA: string
  layerB: string
  captionClassName?: string
  reversed?: boolean
}

export const GOLD_PANEL: StoryPanelContent = {
  index: '01',
  eyebrow: 'Solid Gold',
  title: 'Gold, made to last.',
  body: 'Chains, necklaces, and bracelets in solid gold — the pieces you reach for every day. Each one is photographed as it really looks and checked by hand, then shipped to your door fully insured. We tell you the metal and the weight up front, so the description does the work.',
  href: '/shop',
  ctaLabel: 'Shop gold',
  captionLeft: 'Chains · Necklaces · Bracelets',
  captionRight: 'One in stock',
  layerA:
    'bg-[radial-gradient(ellipse_at_30%_20%,var(--color-antique-gold-soft)_0%,var(--color-greek-terracotta)_55%,var(--color-cedar-soft)_100%)]',
  layerB:
    'bg-[radial-gradient(circle_at_70%_75%,color-mix(in_srgb,var(--color-sun-gold)_65%,transparent)_0%,transparent_45%)] mix-blend-screen',
  captionClassName: 'text-parchment/90',
}

export const FINE_PANEL: StoryPanelContent = {
  index: '02',
  eyebrow: 'Fine Jewelry',
  title: 'Ready to wear, every day.',
  body: 'Earrings, pendants, and finished rings — ready to wear out of the box. Most ship within a day or two, fully insured, with a 15-day return window on unworn pieces. Rings are sized as listed.',
  href: '/shop',
  ctaLabel: 'Shop fine jewelry',
  captionLeft: 'Earrings · Pendants · Rings',
  captionRight: '15-day returns',
  layerA:
    'bg-[radial-gradient(ellipse_at_75%_25%,color-mix(in_srgb,var(--color-greek-teal)_30%,var(--color-limestone-deep))_0%,var(--color-limestone)_55%,var(--color-parchment-warm)_100%)]',
  layerB:
    'bg-[radial-gradient(circle_at_25%_80%,color-mix(in_srgb,var(--color-greek-terracotta)_60%,transparent)_0%,transparent_50%)]',
  reversed: true,
}

export function StoryPanel({
  panel,
  plateChildren,
}: {
  panel: StoryPanelContent
  /// Optional imagery slotted into the plate (Phase 3: product shots).
  plateChildren?: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={`story-${panel.index}`}
      className="border-t border-limestone-deep/60"
    >
      <Container className="grid items-center gap-10 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
        <FadeIn className={panel.reversed ? 'lg:order-last' : undefined}>
          <p className="font-serif text-caption italic text-bronze">
            {panel.index} — {panel.eyebrow}
          </p>
          <h2
            id={`story-${panel.index}`}
            className="mt-5 font-serif text-display font-light italic text-ink"
          >
            {panel.title}
          </h2>
          <p className="mt-6 max-w-xl text-body leading-relaxed text-ink-soft">
            {panel.body}
          </p>
          <Link
            href={panel.href}
            className="mt-8 inline-block text-eyebrow text-bronze underline decoration-bronze/60 underline-offset-8 transition-colors duration-300 hover:text-olive hover:decoration-olive"
          >
            {panel.ctaLabel} →
          </Link>
        </FadeIn>
        <ParallaxPlate
          layerA={panel.layerA}
          layerB={panel.layerB}
          captionLeft={panel.captionLeft}
          captionRight={panel.captionRight}
          captionClassName={panel.captionClassName}
        >
          {plateChildren}
        </ParallaxPlate>
      </Container>
    </section>
  )
}
