import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'The terms that apply when you browse, sign in, or purchase from HV Jewelers.',
}

export default function TermsPage() {
  return (
    <Container className="py-24 md:py-32" width="reading">
      <p className="text-eyebrow text-bronze">Terms</p>
      <h1 className="mt-6 font-serif text-display-lg italic font-light text-ink">
        Plain terms of use.
      </h1>
      <p className="mt-4 text-caption text-ink-muted">
        Effective June 1, 2026
      </p>

      <div className="mt-12 space-y-6 text-body leading-relaxed text-ink-soft">
        <p>
          By browsing, signing in, or purchasing from HV Jewelers
          (&ldquo;Hoang Vi Jewelers&rdquo;) you agree to these terms.
        </p>

        <h2 className="mt-10 font-serif text-heading text-ink">Catalog</h2>
        <p>
          Photographs and descriptions describe the actual piece. We verify
          each piece in person before listing. Color, scale, and surface
          marks can read differently on different screens — when in doubt,
          write the concierge for additional photos.
        </p>

        <h2 className="mt-10 font-serif text-heading text-ink">Purchases</h2>
        <p>
          Checkout is processed by Shopify on our behalf. Prices are in U.S.
          dollars unless otherwise stated and exclude applicable taxes and
          duties, which are calculated at checkout.
        </p>

        <h2 className="mt-10 font-serif text-heading text-ink">Returns</h2>
        <p>
          Unworn pieces are eligible for a 15-day return in original
          condition. Earrings are final sale for hygiene, and resized or
          engraved pieces are final sale. You cover insured return
          shipping. See{' '}
          <Link
            href="/returns"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive"
          >
            Returns
          </Link>{' '}
          for the full policy.
        </p>

        <h2 className="mt-10 font-serif text-heading text-ink">Accounts</h2>
        <p>
          You are responsible for keeping your account credentials safe. We
          may disable accounts that abuse the site, hammer cart or auth
          endpoints, or attempt to interfere with other shoppers&apos;
          purchases.
        </p>

        <h2 className="mt-10 font-serif text-heading text-ink">
          Intellectual property
        </h2>
        <p>
          Site copy, photography, and branding are owned by HV Jewelers and
          may not be reused without written permission. Maker marks and
          signatures depicted on pieces belong to their respective rights
          holders.
        </p>

        <h2 className="mt-10 font-serif text-heading text-ink">No warranties beyond the obvious</h2>
        <p>
          We describe each piece as accurately as we can. If a piece arrives
          materially different from its description, write within 7 days for
          a remedy. Beyond that, the site is provided as-is.
        </p>

        <h2 className="mt-10 font-serif text-heading text-ink">Changes</h2>
        <p>
          We may update these terms; the effective date above is the current
          version.
        </p>

        <p className="mt-12">
          Questions:{' '}
          <a
            href="mailto:concierge@hvjewelers.com"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive"
          >
            concierge@hvjewelers.com
          </a>
        </p>
      </div>
    </Container>
  )
}
