import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { EmptyState } from '@/components/store/empty-state'
import { FadeIn } from '@/components/store/fade-in'
import { ShopProductCard } from '@/components/shop/shop-product-card'
import { listProducts } from '@/lib/shopify/products'
import { shopifyConfigured } from '@/lib/shopify/client'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'The full HV Jewelers catalog: signets, bands, chain, and stones, all unworn.',
}

export default async function ShopPage() {
  const { products } = await listProducts(250)
  const configured = shopifyConfigured()

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
              The full catalog. Unworn pieces across vintage and modern fine
              jewelry, photographed and described in person before they go
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
          <ul className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <li key={p.id}>
                <ShopProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </Container>

      {products.length > 0 && (
        <Container className="pb-24">
          <div className="border-t border-limestone-deep/60 pt-10">
            <p className="text-eyebrow text-ink-muted">House notes</p>
            <p className="mt-4 max-w-2xl text-body leading-relaxed text-ink-soft">
              Most pieces are one of one. If something here is right but
              the size is wrong, write the concierge and we will quote a
              resize where the geometry allows.
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
