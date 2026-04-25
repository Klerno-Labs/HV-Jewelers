import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { Price, PricePair } from '@/components/store/price'
import { RemoveFromBag } from '@/components/store/remove-from-bag'
import { CheckoutButton } from '@/components/store/checkout-button'
import { ERA_LABELS } from '@/lib/products/eras'
import { getOpenCart } from '@/lib/cart/cart'

export const metadata: Metadata = {
  title: 'Bag',
  robots: { index: false, follow: false },
}

interface BagPageProps {
  searchParams: Promise<{ added?: string; removed?: string; error?: string }>
}

export default async function BagPage({ searchParams }: BagPageProps) {
  const sp = await searchParams
  const cart = await getOpenCart()
  const items = cart?.items ?? []

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  )
  const currency = items[0]?.product.currency ?? 'USD'

  return (
    <Container className="py-12 md:py-16" width="default">
      <Breadcrumbs
        items={[{ label: 'HV Jewelers', href: '/' }, { label: 'Bag' }]}
      />

      <div className="mt-10">
        <p className="text-eyebrow text-bronze">Your Bag</p>
        <h1 className="mt-4 font-serif text-display text-ink">
          {items.length === 0
            ? 'The bag is empty.'
            : items.length === 1
              ? '1 piece kept aside'
              : `${items.length} pieces kept aside`}
        </h1>
      </div>

      {sp?.added ? <Banner kind="added" /> : null}
      {sp?.removed ? <Banner kind="removed" /> : null}
      {sp?.error ? <ErrorBanner code={sp.error} /> : null}

      {items.length === 0 ? (
        <EmptyBag />
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <ul className="divide-y divide-limestone-deep/40 border-y border-limestone-deep/40">
            {items.map((item) => {
              const image = item.product.images[0]
              return (
                <li key={item.id} className="flex gap-6 py-6">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="block flex-none"
                    aria-label={`View ${item.product.title}`}
                  >
                    <div className="relative h-32 w-24 overflow-hidden bg-limestone">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={image.alt ?? item.product.title}
                          width={image.width ?? 400}
                          height={image.height ?? 500}
                          sizes="96px"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-parchment-warm)_0%,var(--color-limestone)_72%)]"
                        />
                      )}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-eyebrow text-ink-muted">
                      {ERA_LABELS[item.product.era]}
                    </p>
                    <p className="mt-2 font-serif text-title text-ink">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="transition-colors duration-300 hover:text-olive"
                      >
                        {item.product.title}
                      </Link>
                    </p>
                    <p className="mt-2 text-caption text-ink-muted">
                      Qty {item.quantity}
                    </p>
                    <p className="mt-3">
                      <RemoveFromBag cartItemId={item.id} />
                    </p>
                  </div>
                  <Price
                    cents={item.unitPriceCents * item.quantity}
                    currency={item.product.currency}
                    className="text-caption text-ink"
                  />
                </li>
              )
            })}
          </ul>

          <aside className="border border-limestone-deep/60 bg-parchment p-8 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-serif text-title text-ink">Summary</h2>
            <dl className="mt-6 space-y-3 text-caption">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd>
                  <PricePair cents={subtotalCents} compareAtCents={null} currency={currency} />
                </dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Shipping</dt>
                <dd>Calculated at checkout</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Tax</dt>
                <dd>Calculated at checkout</dd>
              </div>
            </dl>
            <div className="mt-8">
              <CheckoutButton />
            </div>
            <p className="mt-4 text-caption leading-relaxed text-ink-muted">
              Secure payment with Stripe. Domestic shipping is insured and
              signed for on delivery. We hold your piece while you complete
              payment.
            </p>
            <p className="mt-6 text-caption text-ink-muted">
              Rather have us complete the purchase with you directly?{' '}
              <Link
                href="/contact"
                className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
              >
                Concierge purchase →
              </Link>
            </p>
          </aside>
        </div>
      )}
    </Container>
  )
}

function Banner({ kind }: { kind: 'added' | 'removed' }) {
  const text =
    kind === 'added'
      ? 'Kept aside. The piece is held while you decide.'
      : 'Released. The piece is back in the archive.'
  return (
    <p
      role="status"
      className="mt-8 inline-block border-l border-bronze bg-parchment-warm/40 py-3 pl-4 pr-6 text-caption leading-relaxed text-ink-soft"
    >
      {text}
    </p>
  )
}

const ERROR_COPY: Record<string, string> = {
  empty: 'Your bag is empty. Add a piece to begin checkout.',
  product_inactive:
    'One of the pieces in your bag is no longer available. Please remove it and try again.',
  no_stock:
    'The reservation on one of your pieces has lapsed. Please remove it and add it again to re-reserve.',
  held_by_another:
    'One of your pieces is now held by another customer. Remove it from your bag and we’ll look out for something similar.',
  checkout_failed:
    'We couldn’t reach Stripe to start checkout. Please try again. Your bag is unchanged.',
  checkout_unavailable:
    'Online checkout is not yet enabled. Send a note and we will complete this purchase with you directly.',
}

function ErrorBanner({ code }: { code: string }) {
  const text = ERROR_COPY[code] ?? 'Something went wrong. Please try again.'
  return (
    <p
      role="alert"
      className="mt-8 inline-block border-l border-cedar-deep bg-cedar/10 py-3 pl-4 pr-6 text-caption leading-relaxed text-cedar-deep"
    >
      {text}
    </p>
  )
}

function EmptyBag() {
  return (
    <div className="mt-16 border border-limestone-deep/60 bg-parchment px-8 py-20 text-center">
      <p className="mx-auto max-w-md text-body leading-relaxed text-ink-soft">
        Pieces you hold for purchase will appear here. Most archive pieces
        are one-of-one, so adding a piece to the bag reserves it briefly
        while you decide.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        <Link
          href="/collections/new-arrivals"
          className="text-caption text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
        >
          See New Arrivals
        </Link>
        <Link
          href="/collections/jade"
          className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
        >
          Browse Jade
        </Link>
      </div>
    </div>
  )
}
