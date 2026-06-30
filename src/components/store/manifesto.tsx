import { Container } from '@/components/layout/container'
import { FadeIn } from './fade-in'

/**
 * Typography-only block. Quiet, generous, no imagery. Sits between heavy
 * visual sections and re-establishes the brand voice.
 */
export function Manifesto() {
  return (
    <section className="border-y border-limestone-deep/60 bg-parchment">
      <Container className="py-28 md:py-40" width="reading">
        <FadeIn>
          <p className="text-eyebrow text-bronze">About the house</p>
          <p className="mt-12 font-serif text-display font-light italic text-ink">
            Hand-picked, and no two the same.
          </p>
          <p className="mt-10 text-subtitle leading-relaxed text-ink-soft">
            HV Jewelers is a small, family-style collection of fine
            jewelry: necklaces, earrings, rings, and bracelets, each piece
            chosen and looked at in person before we list it. No two are
            exactly the same, and we want every one to feel personal,
            meaningful, and unforgettable.
          </p>
        </FadeIn>
      </Container>
    </section>
  )
}
