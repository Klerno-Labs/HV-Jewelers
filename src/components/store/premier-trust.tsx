import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { BUSINESS } from '@/lib/business'
import { FadeIn } from './fade-in'

/**
 * Makes the existing HV/Premier relationship visible to people, not just
 * structured-data crawlers. The section contains no invented certification,
 * warranty, response-time, or product-origin claims.
 */
export function PremierTrust() {
  return (
    <section className="border-y border-limestone-deep/60 bg-limestone/30">
      <Container className="py-20 md:py-24">
        <FadeIn className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-eyebrow text-bronze">
              Houston showroom · Since {BUSINESS.showroomSince}
            </p>
            <h2 className="mt-6 max-w-[18ch] font-serif text-display font-light italic leading-[1.08] text-ink">
              The online collection of {BUSINESS.showroomName}.
            </h2>
            <p className="mt-6 max-w-2xl text-body leading-relaxed text-ink-soft">
              Every piece listed here is held by the same family jeweler behind
              our Houston showroom. See a piece in person, ask for another
              angle, or call before visiting and we will have it ready at the
              counter.
            </p>
          </div>

          <div className="border-limestone-deep/70 lg:border-l lg:pl-10">
            <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="text-eyebrow text-ink-muted">Call the showroom</dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${BUSINESS.telephone}`}
                    className="font-serif text-heading text-ink underline decoration-bronze/50 underline-offset-4 transition-colors hover:text-olive hover:decoration-olive"
                  >
                    {BUSINESS.telephoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-eyebrow text-ink-muted">Visit in Houston</dt>
                <dd className="mt-2 text-body leading-relaxed text-ink-soft">
                  {BUSINESS.address.street}
                  <br />
                  {BUSINESS.address.city}, {BUSINESS.address.region}{' '}
                  {BUSINESS.address.postalCode}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-caption tracking-wide">
              <Link
                href="/about"
                className="text-ink underline decoration-bronze/60 underline-offset-4 transition-colors hover:text-olive hover:decoration-olive"
              >
                About the family →
              </Link>
              <a
                href={BUSINESS.showroomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-bronze/60 underline-offset-4 transition-colors hover:text-olive hover:decoration-olive"
              >
                Showroom services →
              </a>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  )
}
