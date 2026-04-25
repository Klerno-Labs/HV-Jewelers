import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { Price, PricePair } from '@/components/store/price'
import { ConciergeClose } from '@/components/store/concierge-close'
import { ERA_LABELS } from '@/lib/products/eras'
import { finalizeOrderFromSession } from '@/lib/orders/checkout'
import { getStripe, isStripeConfigured } from '@/lib/payments/stripe'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

async function loadOrderBySession(sessionId: string) {
  return prisma.order
    .findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { lines: true },
    })
    .catch(() => null)
}

/**
 * Webhook race fallback. If the customer lands on /checkout/success
 * before Stripe has delivered the webhook, retrieve the session from
 * Stripe directly and finalize. Idempotent — if the webhook beats us,
 * the finalize is a no-op.
 */
async function finalizeOnViewIfNeeded(sessionId: string) {
  if (!isStripeConfigured()) return
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['shipping_cost', 'total_details', 'payment_intent'],
    })
    if (session.payment_status === 'paid') {
      await finalizeOrderFromSession(session)
    }
  } catch (err) {
    console.warn('[checkout/success] fallback finalize failed', err)
  }
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const sessionId = sp.session_id
  if (!sessionId) redirect('/')

  let order = await loadOrderBySession(sessionId)

  // If the webhook has not reached us yet, try once to finalize from the
  // live session. Then re-read the order.
  if (!order || order.paymentStatus !== 'CAPTURED') {
    await finalizeOnViewIfNeeded(sessionId)
    order = await loadOrderBySession(sessionId)
  }

  if (!order) {
    return <ProcessingBanner sessionId={sessionId} />
  }

  const paid = order.paymentStatus === 'CAPTURED'

  return (
    <>
      <Container className="py-10">
        <Breadcrumbs
          items={[{ label: 'HV Jewelers', href: '/' }, { label: 'Order confirmed' }]}
        />
      </Container>

      <Container className="pb-16" width="reading">
        <p className="text-eyebrow text-bronze">Thank you</p>
        <h1 className="mt-6 font-serif text-display italic font-light text-ink">
          {paid ? 'The piece is yours.' : 'Your order is being confirmed.'}
        </h1>
        <p className="mt-8 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
          {paid ? (
            <>
              Payment received. We have your order and will prepare it by
              hand for shipment. A confirmation has been sent to{' '}
              <span className="font-serif text-ink">{order.email}</span>.
            </>
          ) : (
            'Your payment is still being confirmed with Stripe. This usually clears within a minute.'
          )}
        </p>

        <div className="mt-10 border-t border-limestone-deep/60 pt-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Pair label="Order number" value={order.orderNumber} />
            <Pair label="Status" value={paid ? 'Paid · Processing' : 'Confirming'} />
          </dl>
        </div>

        {/* ─── Items ─── */}
        <section className="mt-12">
          <p className="text-eyebrow text-ink-muted">Pieces</p>
          <ul className="mt-4 divide-y divide-limestone-deep/40 border-y border-limestone-deep/40">
            {order.lines.map((line) => (
              <li key={line.id} className="flex gap-6 py-6">
                <div className="relative h-28 w-20 flex-none overflow-hidden bg-limestone">
                  {line.productImage ? (
                    <Image
                      src={line.productImage}
                      alt={line.productTitle}
                      width={300}
                      height={420}
                      sizes="80px"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-eyebrow text-ink-muted">
                    {ERA_LABELS[line.productEra]}
                  </p>
                  <p className="mt-2 font-serif text-title text-ink">
                    <Link
                      href={`/products/${line.productSlug}`}
                      className="transition-colors hover:text-olive"
                    >
                      {line.productTitle}
                    </Link>
                  </p>
                  <p className="mt-2 text-caption text-ink-muted">
                    Qty {line.quantity}
                    {line.policyFinalSale ? ' · Final sale' : ''}
                  </p>
                </div>
                <Price
                  cents={line.totalCents}
                  currency={order.currency}
                  className="text-caption text-ink"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* ─── Totals ─── */}
        <section className="mt-10">
          <p className="text-eyebrow text-ink-muted">Totals</p>
          <dl className="mt-4 space-y-2 text-caption">
            <Totals
              label="Subtotal"
              cents={order.subtotalCents}
              currency={order.currency}
            />
            <Totals
              label="Shipping"
              cents={order.shippingCents}
              currency={order.currency}
            />
            {order.discountCents > 0 ? (
              <Totals
                label="Discount"
                cents={-order.discountCents}
                currency={order.currency}
              />
            ) : null}
            {order.taxCents > 0 ? (
              <Totals label="Tax" cents={order.taxCents} currency={order.currency} />
            ) : null}
            <div className="mt-4 flex justify-between border-t border-limestone-deep/40 pt-4 text-body text-ink">
              <dt>Total</dt>
              <dd>
                <PricePair
                  cents={order.totalCents}
                  compareAtCents={null}
                  currency={order.currency}
                />
              </dd>
            </div>
          </dl>
        </section>

        {/* ─── Shipping ─── */}
        {paid && order.shipLine1 ? (
          <section className="mt-12 border-t border-limestone-deep/60 pt-10">
            <p className="text-eyebrow text-ink-muted">Shipping to</p>
            <address className="mt-4 not-italic text-body leading-relaxed text-ink-soft">
              {order.shipName}
              <br />
              {order.shipLine1}
              {order.shipLine2 ? (
                <>
                  <br />
                  {order.shipLine2}
                </>
              ) : null}
              <br />
              {order.shipCity}, {order.shipRegion} {order.shipPostalCode}
              <br />
              {order.shipCountry}
            </address>
            {order.signatureRequired ? (
              <p className="mt-3 text-caption text-ink-muted">
                Signature required on delivery.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ─── What happens next ─── */}
        <section className="mt-16 border-t border-limestone-deep/60 pt-10">
          <p className="text-eyebrow text-ink-muted">What happens next</p>
          <ul className="mt-6 space-y-3 text-body leading-relaxed text-ink-soft">
            <li>
              We verify the piece, photograph any last details, and prepare
              it for shipment.
            </li>
            <li>
              Your order ships insured and signed-for. A tracking number
              follows by email once it&apos;s in hand.
            </li>
            <li>
              Send a note to the{' '}
              <Link
                href="/contact"
                className="underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
              >
                concierge
              </Link>{' '}
              any time and we&apos;ll get back to you.
            </li>
          </ul>
        </section>
      </Container>

      <ConciergeClose />
    </>
  )
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow text-ink-muted">{label}</dt>
      <dd className="mt-2 font-mono text-body text-ink">{value}</dd>
    </div>
  )
}

function Totals({
  label,
  cents,
  currency,
}: {
  label: string
  cents: number
  currency: string
}) {
  return (
    <div className="flex justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd>
        <Price cents={cents} currency={currency} />
      </dd>
    </div>
  )
}

function ProcessingBanner({ sessionId }: { sessionId: string }) {
  return (
    <Container className="py-20" width="reading">
      <p className="text-eyebrow text-bronze">Confirming your order</p>
      <h1 className="mt-6 font-serif text-display italic font-light text-ink">
        One moment.
      </h1>
      <p className="mt-8 max-w-xl text-body leading-relaxed text-ink-soft">
        Stripe is confirming your payment. This page refreshes itself; if
        it takes longer than a minute, write the{' '}
        <Link
          href="/contact"
          className="underline underline-offset-4 decoration-bronze/60 hover:text-olive"
        >
          concierge
        </Link>{' '}
        with the reference below and we will track it down.
      </p>
      <p className="mt-10 font-mono text-caption text-ink-muted">
        Session: {sessionId}
      </p>
      {/* CSP-safe meta refresh — no inline JS, no script. Refreshes in 5s. */}
      <meta httpEquiv="refresh" content="5" />
    </Container>
  )
}
