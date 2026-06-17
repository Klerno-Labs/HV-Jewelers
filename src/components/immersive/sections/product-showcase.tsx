import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { HoverTilt } from '@/components/immersive/hover-tilt'
import { ShopProductCard } from '@/components/shop/shop-product-card'
import type { ShopifyProduct } from '@/lib/shopify/types'

/** Staggered per-card entrance delays (cycles across the grid). */
const CARD_DELAYS = [0, 100, 150, 200] as const

/**
 * ProductShowcase — "Most Recent / Newly added." grid.
 *
 * Phase 1 stub: renders the existing ShopProductCard grid with the
 * approved row-head layout. Phase 2 adds staggered entrances and the
 * 2.5D hover treatment; Phase 3 switches the feed to tag-filtered
 * queries (new-arrival) instead of a slice of the latest products.
 */
export function ProductShowcase({
  products,
  eyebrow = 'Most Recent',
  title = 'Newly added.',
}: {
  products: ShopifyProduct[]
  eyebrow?: string
  title?: string
}) {
  if (products.length === 0) return null

  return (
    <section
      aria-labelledby="showcase-heading"
      className="border-t border-limestone-deep/60 bg-temple-stone"
    >
      <Container className="py-24 md:py-32">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-eyebrow text-ink-muted">{eyebrow}</p>
            <h2
              id="showcase-heading"
              className="mt-4 font-serif text-display font-light italic text-ink"
            >
              {title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden text-caption tracking-wide text-ink-soft underline decoration-bronze/60 underline-offset-4 transition-colors duration-300 hover:text-olive md:inline"
          >
            See all →
          </Link>
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {products.map((product, i) => (
            <li key={product.id}>
              <FadeIn delay={CARD_DELAYS[i % CARD_DELAYS.length] ?? 0}>
                <HoverTilt>
                  <ShopProductCard product={product} />
                </HoverTilt>
              </FadeIn>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
