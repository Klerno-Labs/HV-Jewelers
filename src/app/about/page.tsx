import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'About HV Jewelers and the Houston Showroom',
  description:
    'HV Jewelers is the online fine-jewelry collection of Premier Jewelers Hoang Vi, a family-owned Houston jeweler serving customers since 2005.',
}

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[55%]"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,var(--color-cedar-soft)_0%,var(--color-parchment)_55%,transparent_85%)]" />
        </div>
        <Container className="pb-16 pt-24 md:pt-32">
          <FadeIn className="max-w-3xl">
            <p className="text-eyebrow text-bronze">About · HV Jewelers</p>
            <h1 className="mt-10 font-serif text-display-lg font-light italic leading-[1.05] text-ink">
              The right piece, not just any piece.
            </h1>
            <p className="mt-10 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              The online collection of {BUSINESS.showroomName}, family-owned in
              Houston since {BUSINESS.showroomSince}.
            </p>
          </FadeIn>
        </Container>
      </section>

      <Container className="pb-28" width="reading">
        <FadeIn>
          <p className="text-subtitle leading-relaxed text-ink">
            We help customers find jewelry for engagements, anniversaries,
            birthdays, milestones, gifts, and the pieces they simply want to
            wear. The work is personal, and the answer is not always the most
            expensive piece in the case.
          </p>
          <div className="mt-8 space-y-7 text-body leading-[1.85] text-ink-soft">
            <p>
              We are not trying to imitate a large chain. We buy a single piece
              of each design from our wholesalers, choosing for material,
              workmanship, proportion, and character. When one sells, it is
              gone unless we can source something similar.
            </p>
            <p>
              Product pages state what we can verify: metal, stones, weight,
              dimensions, size, and construction. When documentation or a claim
              is not available, we would rather say less than invent certainty.
            </p>
            <p>
              HV Jewelers is a real online storefront backed by a real Houston
              counter. The same family behind {BUSINESS.showroomName} holds the
              pieces, answers the phone, and makes them available for a live
              video or private viewing before purchase.
            </p>
            <p className="text-ink">
              Visit us at {BUSINESS.address.street} in {BUSINESS.address.city},{' '}
              {BUSINESS.address.region}, or call {BUSINESS.telephoneDisplay} and
              ask us to pull a specific piece from the case.
            </p>
            <p>
              The physical showroom also handles custom design, certified
              diamonds, repairs, watch service, and in-person jewelry guidance.
              Those services are described on the{' '}
              <a
                href={BUSINESS.showroomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-bronze/60 underline-offset-4 hover:text-olive hover:decoration-olive"
              >
                Premier Jewelers website
              </a>
              .
            </p>
          </div>
        </FadeIn>
      </Container>

      <ConciergeClose />
    </>
  )
}
