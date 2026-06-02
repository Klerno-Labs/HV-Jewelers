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
            We&apos;re small, and we&apos;d rather stay that way.
          </p>
          <p className="mt-10 text-subtitle leading-relaxed text-ink-soft">
            Hoang Vi Jewelers is a small collection of fine jewelry. We
            keep it small on purpose — signets, bands, fine chain, and
            stones, each one chosen and looked at in person before we
            list it. We&apos;d rather carry less and know it well.
          </p>
        </FadeIn>
      </Container>
    </section>
  )
}
