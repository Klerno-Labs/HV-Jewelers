import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Returns',
  description:
    'How returns work at HV Jewelers — a 15-day return on unworn items in original condition. Earrings are final sale; you cover insured return shipping.',
}

export default function ReturnsPage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Returns</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        What can come back, and what can&apos;t.
      </h1>

      <div className="hv-gold-rule my-12 w-16" />

      <p className="text-subtitle leading-relaxed text-ink-soft">
        Every piece has its return rules listed on its product page and
        on your receipt. Here&apos;s the full picture in one place. Because
        we only stock one of each piece, returns are refunds rather than
        exchanges.
      </p>

      <dl className="mt-12 space-y-12 text-body leading-relaxed text-ink-soft">
        <div>
          <dt className="text-eyebrow text-ink-muted">Most pieces</dt>
          <dd className="mt-3">
            Eligible for a{' '}
            <span className="font-serif text-ink">15-day return</span>{' '}
            on unworn items in original condition. The window starts the
            day you receive the piece. Send it back in the original
            packaging with any tags still attached.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Earrings</dt>
          <dd className="mt-3">
            <span className="font-serif text-ink">Final sale.</span> For
            hygiene, earrings can&apos;t be returned once they&apos;ve
            shipped. Please check sizing and details on the product page
            before you order.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Resized or engraved pieces</dt>
          <dd className="mt-3">
            Pieces that were resized or engraved are final sale. Asking
            for a resize or engraving voids the return window even if the
            piece would otherwise be eligible.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Damaged or not as described</dt>
          <dd className="mt-3">
            <span className="font-serif text-ink">We&apos;ll make it right.</span>{' '}
            If something arrives damaged or doesn&apos;t match the
            description, send a note within 7 days of receipt with a
            photo. We&apos;ll cover the return shipping and refund you.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Return shipping</dt>
          <dd className="mt-3">
            For standard returns, you cover insured return shipping with
            signature confirmation. UPS or FedEx with declared value for
            the full purchase price is what we recommend. Pieces lost in
            transit without insurance aren&apos;t our liability.
          </dd>
        </div>
      </dl>

      <section className="mt-16 border-t border-limestone-deep/60 pt-10">
        <p className="text-eyebrow text-ink-muted">How to start a return</p>
        <ol className="mt-6 space-y-3 text-body leading-relaxed text-ink-soft">
          <li>
            <span className="font-serif text-ink">1.</span> Write to{' '}
            <Link
              href="/contact"
              className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
            >
              us
            </Link>{' '}
            within your return window with your order number. Every
            return goes through a person.
          </li>
          <li>
            <span className="font-serif text-ink">2.</span> We&apos;ll
            reply with return instructions, the address to ship to, and
            any insurance requirements for your specific piece.
          </li>
          <li>
            <span className="font-serif text-ink">3.</span> Ship it back
            in the original packaging, insured and signature-required,
            at your cost. We can&apos;t accept returns that arrive
            without signature confirmation.
          </li>
          <li>
            <span className="font-serif text-ink">4.</span> Once we
            receive and inspect it, we refund to the original payment
            method, usually within a few business days.
          </li>
        </ol>
      </section>
    </Container>
  )
}
