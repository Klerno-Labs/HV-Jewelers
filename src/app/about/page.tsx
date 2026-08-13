import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'About',
  description:
    'For over 20 years, HV Jewelers has helped customers find pieces that celebrate life’s most important moments. A small, family-style jeweler stocking a single piece of each design, chosen for its beauty, quality, and character.',
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
        <Container className="pt-24 pb-16 md:pt-32">
          <FadeIn className="max-w-3xl">
            <p className="text-eyebrow text-bronze">About · HV Jewelers</p>
            <h1 className="mt-10 font-serif text-display-lg italic font-light leading-[1.05] text-ink">
              The right piece, not just any piece.
            </h1>
            <p className="mt-10 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              At HV Jewelers, we believe jewelry should feel personal,
              meaningful, and unforgettable.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ─── One continuous narrative (no slabs, no dividers) ─── */}
      <Container className="pb-28" width="reading">
        <FadeIn>
          <p className="text-subtitle leading-relaxed text-ink">
            For over 20 years, we have helped customers find pieces that
            celebrate life&apos;s most important moments. As a small,
            family-style jewelry store, we put customer service first and take
            pride in helping each person find the right piece, not just any
            piece.
          </p>
          <div className="mt-8 space-y-7 text-body leading-[1.85] text-ink-soft">
            <p>
              We are not trying to be like the big jewelry stores. You will not
              find rows of identical items or hundreds of the same design in our
              showcases. Instead, we buy a single piece of each design from our
              wholesaler, choosing each for its beauty, quality, and character.
            </p>
            <p>
              Every piece in our store is selected with care, and we buy only
              a single piece of each design from our wholesaler, so once one
              sells it is gone. We want the jewelry you choose from HV
              Jewelers to be something you are proud to give, proud to wear, and
              something that brings real excitement and joy to the person
              receiving it.
            </p>
            <p className="text-ink">
              Whether you are shopping for an engagement, anniversary, birthday,
              special occasion, or simply something beautiful, we are here to
              help you find a piece that feels right.
            </p>
            {/* Trading history and a real counter, stated plainly. This is
                the transparency Google's Misrepresentation policy asks for,
                and it is also simply true: the online collection and the
                Houston store are the same people. */}
            <p>
              We are a real store with a real counter. HV Jewelers is the
              online collection of Premier Jewelers, our shop at{' '}
              {BUSINESS.address.street} in {BUSINESS.address.city},{' '}
              {BUSINESS.address.region}, where Hoang Vi has served customers
              for more than 20 years. Every piece on this site can be seen in
              person, and you are welcome to call at{' '}
              {BUSINESS.telephoneDisplay} before you come by so we have it
              ready.
            </p>
          </div>
        </FadeIn>
      </Container>

      <ConciergeClose />
    </>
  )
}
