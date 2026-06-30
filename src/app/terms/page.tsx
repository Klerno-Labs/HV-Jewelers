// Terms of service. Same structure as /accessibility + /privacy.
//
// NOTE (Claude, 2026-06-03): production-shaped and stack-accurate (Shopify
// runs checkout/orders/fulfillment; we link to the real Shipping/Returns
// pages). Governing-law + entity name are left general on purpose — confirm
// the legal entity (Pegrio LLC vs. a Hoang Vi entity) and jurisdiction with
// a human before this ships. Fixes the footer's /terms 404.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'The terms for using HV Jewelers and buying from the collection, in plain language.',
}

export default function TermsPage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Terms</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        The agreement, kept simple.
      </h1>

      <div className="hv-gold-rule my-12 w-16" />

      <p className="text-subtitle leading-relaxed text-ink-soft">
        By using HV Jewelers and buying from the collection, you agree to these
        terms. We&apos;ve written them to be readable rather than dense.
      </p>

      <h2 className="mt-14 font-serif text-subtitle text-ink">
        The store &amp; the pieces
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        HV Jewelers is a small, considered collection of fine jewelry. We work to
        describe and photograph every piece accurately. Because screens differ,
        slight variation between an image and the piece in hand is normal.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">
        Orders &amp; payment
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Checkout, payment, and order processing are handled securely by Shopify.
        Placing an order is an offer to buy; an order is confirmed once payment is
        accepted. We may decline or cancel an order, for example, if a piece is
        no longer available or a price was listed in error, and will refund any
        charge in that case.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">
        Pricing &amp; availability
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Prices and availability can change, and we hold only one of each piece.
        We do our best to keep listings current, but we can&apos;t guarantee a
        piece will still be available at the moment you check out.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">
        Shipping &amp; returns
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Shipping timelines and our return policy live on their own pages,{' '}
        <Link
          href="/shipping"
          className="text-olive underline-offset-4 transition-colors hover:underline"
        >
          Shipping
        </Link>{' '}
        and{' '}
        <Link
          href="/returns"
          className="text-olive underline-offset-4 transition-colors hover:underline"
        >
          Returns
        </Link>
        , and form part of these terms.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">Your account</h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        If you create an account, you&apos;re responsible for keeping your
        sign-in secure. Let us know promptly if you suspect any unauthorized use.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">
        What&apos;s ours
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        The HV Jewelers name, the site, its photography, and its writing are ours
        and protected. Please don&apos;t reuse them without permission.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">
        Using the site fairly
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Please use the site lawfully: no attempts to disrupt it, scrape it at
        scale, or misuse it. We may limit or end access where that happens.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">
        Disclaimers &amp; liability
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        The site is provided as-is. To the extent the law allows, we aren&apos;t
        liable for indirect or incidental losses arising from using the site. None
        of this limits rights you have under applicable consumer law.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">Changes</h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        We may update these terms; the current version always lives here. Material
        changes take effect when posted.
      </p>

      <p className="mt-12 leading-relaxed text-ink-soft">
        Questions? Reach us at{' '}
        <Link
          href="mailto:concierge@hvjewelers.com"
          className="text-olive underline-offset-4 transition-colors hover:underline"
        >
          concierge@hvjewelers.com
        </Link>
        .
      </p>
    </Container>
  )
}
