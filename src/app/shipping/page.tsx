import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Shipping',
  description:
    'Insured domestic shipping with signature confirmation. UPS and FedEx, with adult-signature on high-value pieces.',}

export default function ShippingPage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Shipping</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        Insured. Signed for. US only.
      </h1>

      <div className="hv-gold-rule my-12 w-16" />

      <dl className="space-y-12 text-body leading-relaxed text-ink-soft">
        <div>
          <dt className="text-eyebrow text-ink-muted">Carriers</dt>
          <dd className="mt-3">
            We ship UPS or FedEx, fully insured. We pick the carrier based
            on the piece&apos;s value and where it&apos;s going. Anything
            over $5,000 ships FedEx with adult signature required.
          </dd>
        </div>
        <div>
          <dt className="text-eyebrow text-ink-muted">Signature</dt>
          <dd className="mt-3">
            Every package requires a signature on delivery. We can&apos;t
            waive that, and we won&apos;t authorize a release.
          </dd>
        </div>
        <div>
          <dt className="text-eyebrow text-ink-muted">Region</dt>
          <dd className="mt-3">
            Domestic US only for now. We&apos;ll open international once we
            can offer the same insurance and signature protections abroad.
          </dd>
        </div>
        <div>
          <dt className="text-eyebrow text-ink-muted">Lead time</dt>
          <dd className="mt-3">
            Most pieces ship within two business days. Resizing adds 7 to
            10 days. Made-to-order pieces get a lead time at purchase.
          </dd>
        </div>
        <div>
          <dt className="text-eyebrow text-ink-muted">Returned to sender</dt>
          <dd className="mt-3">
            If a package comes back because of a customer-side issue
            (wrong address, refused signature, missed redelivery), the
            original shipping isn&apos;t refundable and the reship cost is
            charged at our cost.
          </dd>
        </div>
      </dl>

      <section className="mt-16 border-t border-limestone-deep/60 pt-8">
        <p className="text-caption text-ink-muted">
          See also{' '}
          <Link
            href="/returns"
            className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
          >
            Returns
          </Link>{' '}
          and{' '}
          <Link
            href="/care"
            className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
          >
            Care &amp; Resizing
          </Link>
          .
        </p>
      </section>
    </Container>
  )
}
