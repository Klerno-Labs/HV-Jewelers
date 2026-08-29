import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'Contact the Houston Showroom',
  description:
    'Visit, call, or email the Premier Jewelers Hoang Vi showroom in Houston for HV Jewelers product questions, live videos, holds, sourcing, and care.',
}

export default function ContactPage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Get in touch</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        Come in, call, or write.
      </h1>
      <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
        HV Jewelers is the online collection of {BUSINESS.showroomName}, our
        family-owned Houston jeweler serving customers since{' '}
        {BUSINESS.showroomSince}. Every available piece can be discussed by
        phone or viewed at the showroom.
      </p>
      <p className="mt-5 max-w-xl text-body leading-relaxed text-ink-soft">
        For the fastest product answer, call during showroom hours. Email
        inquiries are reviewed each business day. Include the product title or
        URL so we can pull the correct piece from the case.
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
            Call ahead for anything you want pulled and ready when you arrive.
          </p>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Call</dt>
          <dd className="mt-3 text-body text-ink">
            <a
              href={`tel:${BUSINESS.telephone}`}
              className="underline decoration-bronze/60 underline-offset-4 hover:text-olive hover:decoration-olive"
            >
              {BUSINESS.telephoneDisplay}
            </a>
          </dd>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            {BUSINESS.hours}. Missed calls are returned during the next staffed
            showroom period.
          </p>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Email</dt>
          <dd className="mt-3 text-body text-ink">
            <a
              href={`mailto:${BUSINESS.email}`}
              className="underline decoration-bronze/60 underline-offset-4 hover:text-olive hover:decoration-olive"
            >
              {BUSINESS.email}
            </a>
          </dd>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            Ask for a live video, measurements, a hold, sizing guidance, or a
            similar piece.
          </p>
        </div>

        <div>
          <dt className="text-eyebrow text-ink-muted">Hours</dt>
          <dd className="mt-3 text-body text-ink">{BUSINESS.hours}</dd>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            Product questions are answered by people at the Houston showroom,
            not an automated sales bot.
          </p>
        </div>
      </dl>

      <section className="mt-16 border-t border-limestone-deep/60 pt-10">
        <p className="text-eyebrow text-ink-muted">Premier showroom services</p>
        <p className="mt-3 max-w-xl text-body leading-relaxed text-ink-soft">
          The physical showroom also handles custom design, certified diamonds,
          repairs, watch service, and in-person jewelry guidance.
        </p>
        <a
          href={BUSINESS.showroomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-caption text-ink underline decoration-bronze/60 underline-offset-4 hover:text-olive hover:decoration-olive"
        >
          Visit the Premier Jewelers website →
        </a>
      </section>

      <section className="mt-12">
        <p className="text-eyebrow text-ink-muted">Care and resizing</p>
        <p className="mt-3 max-w-xl text-body leading-relaxed text-ink-soft">
          Resizing, polishing, and small repairs on pieces bought from us are
          done at cost. We do not take in repair work on pieces from elsewhere
          through the HV storefront.
        </p>
        <Link
          href="/care"
          className="mt-4 inline-block text-caption text-ink underline decoration-bronze/60 underline-offset-4 hover:text-olive hover:decoration-olive"
        >
          Read about care
        </Link>
      </section>
    </Container>
  )
}
