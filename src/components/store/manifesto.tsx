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
            One of each, and then it&apos;s gone.
          </p>
          <p className="mt-10 text-subtitle leading-relaxed text-ink-soft">
            HV Jewelers is a small collection of fine jewelry: necklaces,
            earrings, rings, and bracelets. We buy a single piece of each
            design from our wholesaler and photograph it here in the
            Houston shop before it goes on the site. When one sells,
            it&apos;s gone.
          </p>
        </FadeIn>
      </Container>
    </section>
  )
}
