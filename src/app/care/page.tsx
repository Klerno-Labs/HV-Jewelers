import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Care & Resizing',
  description:
    'How to care for gold, pearls, and modern fine jewelry, and how resizing works at HV Jewelers.',
}

export default function CarePage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Care and resizing</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        How to live with the pieces.
      </h1>

      <div className="hv-gold-rule my-12 w-16" />

      <p className="text-subtitle leading-relaxed text-ink-soft">
        Most of this is gentle. Jewelry is more durable than people think,
        but it lasts longer with a light hand.
      </p>

      <dl className="mt-12 space-y-12 text-body leading-relaxed text-ink-soft">
        <div>
          <dt className="text-eyebrow text-ink-muted">Resizing</dt>
          <dd className="mt-3">
            Resizing is offered on select pieces and noted on each product
            page. Modern Fine rings can usually be resized within ±1 size
            in 7 to 10 days. Vintage Era pieces are sized as made; where
            a resize is possible, the range is narrower. Resizing voids
            the return window.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Gold</dt>
          <dd className="mt-3">
            Solid gold is forgiving. Wash in warm water with a drop of
            mild soap; pat dry with a soft cloth. Skip chlorine; pools and
            hot tubs can pit alloyed gold over time.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Pearls</dt>
          <dd className="mt-3">
            Pearls do better worn regularly than left in a box. Put
            perfume, hairspray, and lotion on first, pearls last. Wipe
            with a soft cloth after wearing. Plan to restring every few
            years.
          </dd>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Storage</dt>
          <dd className="mt-3">
            Store pieces separately so they don&apos;t scratch each other.
            Soft pouches or fabric-lined trays work well. A dry, cool
            drawer is fine; humid rooms (bathrooms) are not.
          </dd>
        </div>
      </dl>

      <section className="mt-16 border-t border-limestone-deep/60 pt-8">
        <p className="text-caption text-ink-muted">
          Need repair, polishing, or sizing outside the listed window?{' '}
          <Link
            href="/contact"
            className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
          >
            Send a note.
          </Link>
        </p>
      </section>
    </Container>
  )
}
