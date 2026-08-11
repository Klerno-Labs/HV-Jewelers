import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Visit or call HV Jewelers in Houston, Texas for inquiries, holds, sourcing requests, and care.',
}

export default function ContactPage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Get in touch</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        Come in, call, or write.
      </h1>
      <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
        We keep a counter in Houston and answer our own phone. Real replies
        from real people, usually within a day or two. We don&apos;t use
        automated chat or bots.
      </p>

      <div className="hv-gold-rule my-12 w-16" />

      <dl className="grid gap-10 sm:grid-cols-2">
        <div>
          <dt className="text-eyebrow text-ink-muted">Visit</dt>
          <dd className="mt-3 text-body text-ink">
            <address className="not-italic leading-relaxed">
              {BUSINESS.address.street}
              <br />
              {BUSINESS.address.city}, {BUSINESS.address.region}{' '}
              {BUSINESS.address.postalCode}
            </address>
          </dd>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            Pieces can be seen in person. Call ahead for anything you want
            pulled and ready when you arrive.
          </p>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Call</dt>
          <dd className="mt-3 text-body text-ink">
            <a
              href={`tel:${BUSINESS.telephone}`}
              className="underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
            >
              {BUSINESS.telephoneDisplay}
            </a>
          </dd>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            {BUSINESS.hours}. Calls outside those hours get a return call
            the next business day.
          </p>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Email</dt>
          <dd className="mt-3 text-body text-ink">
            <a
              href={`mailto:${BUSINESS.email}`}
              className="underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
            >
              {BUSINESS.email}
            </a>
          </dd>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            For questions, holds, sizing, and sourcing requests. Include
            the URL or title of any piece you&apos;re asking about.
          </p>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Hours</dt>
          <dd className="mt-3 text-body text-ink">{BUSINESS.hours}</dd>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            Notes that come in after hours get a reply the next morning.
          </p>
        </div>
      </dl>

      <section className="mt-16">
        <p className="text-eyebrow text-ink-muted">Care and resizing</p>
        <p className="mt-3 max-w-xl text-body leading-relaxed text-ink-soft">
          Resizing, polishing, and small repairs on pieces bought from us
          are done at cost. We don&apos;t take in repair work on pieces
          from elsewhere.
        </p>
        <Link
          href="/care"
          className="mt-4 inline-block text-caption text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
        >
          Read about care
        </Link>
      </section>
    </Container>
  )
}
