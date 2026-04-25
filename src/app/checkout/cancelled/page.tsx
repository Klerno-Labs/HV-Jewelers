import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'

export const metadata: Metadata = {
  title: 'Checkout cancelled',
  robots: { index: false, follow: false },
}

export default function CheckoutCancelledPage() {
  return (
    <Container className="py-16 md:py-24" width="reading">
      <Breadcrumbs
        items={[{ label: 'HV Jewelers', href: '/' }, { label: 'Checkout cancelled' }]}
      />

      <p className="mt-10 text-eyebrow text-bronze">Checkout cancelled</p>
      <h1 className="mt-6 font-serif text-display italic font-light text-ink">
        Your piece is still in the bag.
      </h1>
      <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
        No payment was taken. The piece is still reserved to your bag for
        a short while. Come back when you&apos;re ready and we&apos;ll
        pick up where you left off.
      </p>

      <div className="hv-gold-rule my-12 w-16" />

      <p className="text-body leading-relaxed text-ink-soft">
        If something about the checkout didn&apos;t feel right (price,
        shipping, signature requirement), the{' '}
        <Link
          href="/contact"
          className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
        >
          concierge
        </Link>{' '}
        is happy to talk it through.
      </p>

      <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
        <Link
          href="/bag"
          className="text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
        >
          Return to your bag →
        </Link>
        <Link
          href="/collections/new-arrivals"
          className="text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
        >
          Keep browsing
        </Link>
      </div>
    </Container>
  )
}
