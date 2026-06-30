import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'

export const metadata: Metadata = {
  title: 'About',
  description:
    'For over 20 years, HV Jewelers has helped customers find pieces that celebrate life’s most important moments — a small, family-style jeweler hand-picking jewelry for its beauty, quality, and character. No two pieces are exactly the same.',
}

export default function AboutPage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[55%]"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,var(--color-cedar-soft)_0%,var(--color-parchment)_55%,transparent_85%)]" />
        </div>
        <Container className="py-24 md:py-32">
          <FadeIn className="max-w-3xl">
            <p className="text-eyebrow text-bronze">About · HV Jewelers</p>
            <h1 className="mt-10 font-serif text-display-lg italic font-light leading-[1.05] text-ink">
              The right piece — not just any piece.
            </h1>
            <p className="mt-10 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              At HV Jewelers, we believe jewelry should feel personal,
              meaningful, and unforgettable.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ─── Story ─── */}
      <section className="border-t border-limestone-deep/60 bg-parchment">
        <Container className="py-24 md:py-32" width="reading">
          <FadeIn>
            <p className="text-subtitle leading-relaxed text-ink">
              For over 20 years, we have helped customers find pieces that
              celebrate life&apos;s most important moments. As a small,
              family-style jewelry store, we put customer service first and
              take pride in helping each person find the right piece — not
              just any piece.
            </p>
          </FadeIn>
          <FadeIn
            delay={150}
            className="mt-10 space-y-7 text-body leading-[1.8] text-ink-soft"
          >
            <p>
              We are not trying to be like the big jewelry stores. You will
              not find rows of identical items or hundreds of the same design
              in our showcases. Instead, we carefully hand-pick small batches
              of jewelry, choosing pieces for their beauty, quality, and
              character.
            </p>
            <p>
              Every piece in our store is selected with care, and no two
              pieces are exactly the same. We want the jewelry you choose
              from HV Jewelers to be something you are proud to give, proud to
              wear, and something that brings real excitement and joy to the
              person receiving it.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ─── Closing invitation ─── */}
      <section className="border-t border-limestone-deep/60">
        <Container className="py-24 md:py-32" width="reading">
          <FadeIn>
            <p className="max-w-2xl font-serif text-title italic leading-[1.4] text-ink">
              Whether you are shopping for an engagement, anniversary,
              birthday, special occasion, or simply something beautiful, we
              are here to help you find a piece that feels right.
            </p>
          </FadeIn>
        </Container>
      </section>

      <ConciergeClose />
    </>
  )
}
