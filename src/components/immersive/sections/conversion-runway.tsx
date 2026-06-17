import Link from 'next/link'
import { Container } from '@/components/layout/container'

/**
 * ConversionRunway — the calm, low-motion closing stretch: the three
 * "How we work" pillars followed by the concierge close. Mirrors the
 * existing home content; deliberately minimal animation so the page
 * ends scannable and clickable.
 *
 * Phase 1 stub: static. Phase 2 adds subtle reveal-on-intersect only.
 */

const PILLARS = [
  {
    title: 'Plain about the piece',
    body: 'We tell you the metal, the weight, and the measurements before anything else. Real photos, plain descriptions, no invented stories. If we can’t verify a claim, we don’t make it.',
  },
  {
    title: 'Insured, signed for',
    body: 'Every package ships fully insured with signature required on delivery. Pieces over $5,000 ship adult-signature required.',
    cta: { href: '/shipping', label: 'How shipping works' },
  },
  {
    title: 'Plain about returns',
    body: 'Pieces have a 15-day return window on unworn items in original condition. If it’s not right, send it back — no surprises.',
    cta: { href: '/returns', label: 'Read the return policy' },
  },
] as const

export function ConversionRunway() {
  return (
    <section
      aria-labelledby="runway-heading"
      className="border-t border-limestone-deep/60 bg-limestone/40"
    >
      <Container className="py-24 md:py-28">
        <p
          id="runway-heading"
          className="text-center text-eyebrow text-ink-muted"
        >
          How we work
        </p>
        <div className="mt-12 grid gap-12 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.title}>
              <h3 className="font-serif text-heading text-ink">
                {pillar.title}
              </h3>
              <p className="mt-4 max-w-sm text-body leading-relaxed text-ink-soft">
                {pillar.body}
              </p>
              {'cta' in pillar && pillar.cta ? (
                <Link
                  href={pillar.cta.href}
                  className="mt-5 inline-block text-caption tracking-wide text-ink underline decoration-bronze/60 underline-offset-4 transition-colors duration-300 hover:text-olive hover:decoration-olive"
                >
                  {pillar.cta.label} →
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
