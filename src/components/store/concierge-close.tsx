import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { BUSINESS } from '@/lib/business'
import { FadeIn } from './fade-in'

/**
 * Human closing module. It gives high-ticket shoppers an immediate phone path
 * and a clear email expectation without introducing a chatbot or unsupported
 * response-time promise.
 */
export function ConciergeClose() {
  return (
    <section className="border-t border-limestone-deep/60">
      <Container className="py-28 md:py-36" width="reading">
        <FadeIn>
          <p className="text-eyebrow text-bronze">Ask the showroom</p>
          <p className="mt-8 font-serif text-display-lg font-light italic text-ink">
            Questions about a piece?
          </p>
          <p className="mt-7 max-w-xl text-subtitle leading-relaxed text-ink-soft">
            Call for the fastest answer during showroom hours, or email us for
            sizing, holds, sourcing, additional measurements, and live-video
            requests. Email inquiries are handled by the next business day.
          </p>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-4 text-caption tracking-wide">
            <a
              href={`tel:${BUSINESS.telephone}`}
              className="inline-flex min-h-11 items-center bg-ink px-5 py-3 text-parchment transition-colors hover:bg-olive-deep"
            >
              Call {BUSINESS.telephoneDisplay}
            </a>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center border border-ink px-5 py-3 text-ink transition-colors hover:border-olive hover:text-olive"
            >
              Showroom and email details
            </Link>
          </div>
        </FadeIn>
      </Container>
    </section>
  )
}
