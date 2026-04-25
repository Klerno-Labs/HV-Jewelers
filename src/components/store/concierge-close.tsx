import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { FadeIn } from './fade-in'

/**
 * Quiet closing module. Single typographic statement, a small concierge
 * link. No buttons, no hard CTA — the brand promises nothing it cannot
 * keep.
 */
export function ConciergeClose() {
  return (
    <section className="border-t border-limestone-deep/60">
      <Container className="py-32 md:py-40" width="reading">
        <FadeIn>
          <p className="text-eyebrow text-bronze">Get in touch</p>
          <p className="mt-10 font-serif text-display-lg italic font-light text-ink">
            Questions? We&apos;re here.
          </p>
          <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
            Holds, sizing, sourcing requests, care advice. Write to us
            directly and we&apos;ll get back, usually within a day or
            two.
          </p>
          <Link
            href="/contact"
            className="mt-10 inline-block text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive hover:decoration-olive"
          >
            Send a note
          </Link>
        </FadeIn>
      </Container>
    </section>
  )
}
