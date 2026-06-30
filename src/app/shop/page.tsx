import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { EmptyState } from '@/components/store/empty-state'
import { FadeIn } from '@/components/store/fade-in'
import { ShopBrowser } from '@/components/shop/shop-browser'
import { listProducts } from '@/lib/shopify/products'
import { moneyToCents } from '@/lib/shopify/money'
import { shopifyConfigured } from '@/lib/shopify/client'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'The full HV Jewelers catalog: signets, bands, chain, and stones, fine jewelry, verified in person.',
}

export default async function ShopPage() {
  const { products } = await listProducts(250)
  const configured = shopifyConfigured()

  // Strategic merchandising order: in-stock pieces first (a sold one-of-a-kind
  // sinks), then price descending so the statement pieces lead and anchor the
  // collection's value. Replaces Shopify's BEST_SELLING sort, which is
  // effectively random for a store without sales history.
  const ranked = [...products].sort((a, b) => {
    if (a.availableForSale !== b.availableForSale)
      return a.availableForSale ? -1 : 1
    return (
      moneyToCents(b.priceRange.minVariantPrice) -
      moneyToCents(a.priceRange.minVariantPrice)
    )
  })

  return (
    <>
      <Container className="pt-10">
        <Breadcrumbs
          items={[
            { label: 'HV Jewelers', href: '/' },
            { label: 'Shop' },
          ]}
        />
      </Container>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full md:w-[55%]"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-greek-teal)_14%,var(--color-limestone-deep))_0%,var(--color-parchment)_55%,transparent_85%)]" />
        </div>
        <Container className="py-16 md:py-24">
          <FadeIn>
            <p className="text-eyebrow text-bronze">The Shop</p>
            <h1 className="mt-8 max-w-[18ch] font-serif text-display-lg font-light italic leading-[1.05] text-ink">
              Currently in the case.
            </h1>
            <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
              The full collection. Fine jewelry: signets, bands, chain, and
              stones, photographed and described in person before it goes
              on the site.
            </p>
            <p className="mt-8 text-eyebrow text-ink-muted">
              {products.length === 0
                ? 'Building the case now.'
                : products.length === 1
                  ? '1 piece'
                  : `${products.length} pieces`}
            </p>
          </FadeIn>
        </Container>
      </section>

      <Container className="py-16 md:py-20">
        {products.length === 0 ? (
          <EmptyState
            eyebrow={configured ? 'Quiet for now' : 'Setup in progress'}
            title={
              configured
                ? 'Pieces are on their way.'
                : 'The shop is being configured.'
            }
            body={
              configured
                ? 'A new set is being prepared for the case. Check back soon, or write us and we will hold something aside.'
                : 'Shopify is connected but no products have been published yet. Once a piece is added in Shopify it will appear here automatically.'
            }
            action={{ label: 'Write the house →', href: '/contact' }}
          />
        ) : (
          <ShopBrowser products={ranked} />
        )}
      </Container>

      {products.length > 0 && (
        <Container className="pb-24">
          <div className="border-t border-limestone-deep/60 pt-10">
            <p className="text-eyebrow text-ink-muted">House notes</p>
            <p className="mt-4 max-w-2xl text-body leading-relaxed text-ink-soft">
              We only stock one of each piece, so when it sells it&apos;s
              gone. If something here is right but the size is wrong, write
              the concierge and we will quote a resize where the geometry
              allows.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
            >
              Contact concierge →
            </Link>
          </div>
        </Container>
      )}
    </>
  )
}
