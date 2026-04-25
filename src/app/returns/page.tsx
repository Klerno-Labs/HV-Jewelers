import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Returns',
  description:
    'How returns work at HV Jewelers. Vintage Era and Near Vintage are final sale; Modern Fine pieces have a 15-day window for unworn returns.',
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
        on your receipt. Here&apos;s the full picture in one place.
      </p>

      <dl className="mt-12 space-y-12 text-body leading-relaxed text-ink-soft">
        <div>
          <dt className="text-eyebrow text-ink-muted">Vintage Era and Near Vintage</dt>
          <dd className="mt-3">
            <span className="font-serif text-ink">Final sale.</span> These
            are older pieces, often one of a kind. We describe condition
            honestly so you can decide before you buy. Returns are accepted
            only if we made an error in the description.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Modern Fine Jewelry</dt>
          <dd className="mt-3">
            Most pieces are eligible for a{' '}
            <span className="font-serif text-ink">15-day return</span>{' '}
            on unworn returns in original condition. The window starts the
            day you receive the piece. Send back the original packaging,
            tags, and any certificates that came with it.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Resized, engraved, custom</dt>
          <dd className="mt-3">
            Pieces that were resized, engraved, or made to order are final
            sale. Asking for a resize voids the return window even if the
            piece would otherwise be eligible.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Jade</dt>
          <dd className="mt-3">
            Most jade is final sale. The exact policy is on each product
            page, so read it before you buy.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Damaged or not as described</dt>
          <dd className="mt-3">
            <span className="font-serif text-ink">We&apos;ll make it right.</span>{' '}
            If something arrives damaged or doesn&apos;t match the
            description, send a note within 7 days of receipt with a
            photo. We&apos;ll cover the return shipping and either refund
            or replace.
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
