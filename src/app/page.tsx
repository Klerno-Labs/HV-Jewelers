import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Hero } from '@/components/store/hero'
import { Manifesto } from '@/components/store/manifesto'
import { WorldFeature } from '@/components/store/world-feature'
import { ConciergeClose } from '@/components/store/concierge-close'
import { FadeIn } from '@/components/store/fade-in'
import { ShopProductCard } from '@/components/shop/shop-product-card'
import { listProducts } from '@/lib/shopify/products'

/**
 * The editorial home. Reads the Shopify catalog and ranks it by price,
 * most-expensive first: the priciest available piece leads the hero, then
 * the next pieces fill the two World features and the closing grid in
 * descending order.
 *
 * Only available pieces are ranked, so a sold piece drops off the homepage
 * and the next-priciest piece slides up into its slot — the hero and grids
 * stay populated as one-of-a-kind inventory turns over. Falls back to
 * typography-only treatment when no products are configured yet.
 */
export default async function Home() {
  const { products } = await listProducts(50)

  // Available pieces, most expensive first. Sliced from this single ranked
  // pool so the hero + grids never sit empty while pieces are in stock.
  const ranked = products
    .filter((p) => p.availableForSale)
    .sort(
      (a, b) =>
        parseFloat(b.priceRange.minVariantPrice.amount) -
        parseFloat(a.priceRange.minVariantPrice.amount),
    )

  const feature = ranked[0] ?? products[0] ?? null
  const collection = ranked.slice(1, 5)
  const bench = ranked.slice(5, 9)
  const arrivals = ranked.slice(9, 13)

  return (
    <>
      {/* ─── Editorial hero ─── */}
      <Hero feature={feature} />

      {/* ─── Manifesto ─── */}
      <Manifesto />

      {/* ─── World 01 — The Collection ─── */}
      <WorldFeature
        eyebrow="The Collection"
        title="Chosen with restraint."
        body="A small, edited selection of fine jewelry — signets, bands, fine chain, and stones. Every piece is looked at in person and described plainly: the metal, the stone, the finish. We'd rather carry less and know it well."
        href="/shop"
        ctaLabel="See the collection"
        tone="cedar"
      />
      {collection.length > 0 ? (
        <section className="border-t border-limestone-deep/60">
          <Container className="py-16 md:py-20">
            <FadeIn>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
                {collection.map((p) => (
                  <li key={p.id}>
                    <ShopProductCard product={p} />
                  </li>
                ))}
              </ul>
            </FadeIn>
          </Container>
        </section>
      ) : null}

      {/* ─── World 02 — On the Bench ─── */}
      <WorldFeature
        eyebrow="On the Bench"
        title="Made to wear, every day."
        body="Bands, solitaires, and everyday gold. Most pieces are eligible for a 15-day return in original, unused condition. Resizing voids that window, so size before you buy."
        href="/shop"
        ctaLabel="See the bench"
        imageReversed
        tone="bronze"
      />
      {bench.length > 0 ? (
        <section className="border-t border-limestone-deep/60">
          <Container className="py-16 md:py-20">
            <FadeIn>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
                {bench.map((p) => (
                  <li key={p.id}>
                    <ShopProductCard product={p} />
                  </li>
                ))}
              </ul>
            </FadeIn>
          </Container>
        </section>
      ) : null}

      {/* ─── New Arrivals ─── */}
      {arrivals.length > 0 ? (
        <section className="border-t border-limestone-deep/60">
          <Container className="py-24 md:py-32">
            <FadeIn className="flex items-end justify-between">
              <div>
                <p className="text-eyebrow text-ink-muted">Also in the case</p>
                <h2 className="mt-4 font-serif text-display text-ink">
                  More to consider.
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive md:inline"
              >
                See all →
              </Link>
            </FadeIn>
            <FadeIn delay={150} className="mt-14">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
                {arrivals.map((p) => (
                  <li key={p.id}>
                    <ShopProductCard product={p} />
                  </li>
                ))}
              </ul>
            </FadeIn>
          </Container>
        </section>
      ) : null}

      {/* ─── Care band ─── */}
      <section className="border-t border-limestone-deep/60 bg-limestone/40">
        <Container className="py-24 md:py-28">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted text-center">
              How we work
            </p>
          </FadeIn>
          <FadeIn delay={150} className="mt-12 grid gap-12 md:grid-cols-3">
            <Pillar
              title="Material first"
              body="We talk about the metal, the carve, and the stone before anything else. If we can't verify a claim about a piece, we don't make it."
            />
            <Pillar
              title="Insured, signed for"
              body="Every package ships fully insured with signature required on delivery. Pieces over $5,000 ship adult-signature required."
              cta={{ href: '/shipping', label: 'How shipping works' }}
            />
            <Pillar
              title="Plain about returns"
              body="Most pieces are eligible for a 15-day return in original, unused condition. Earrings, engraved, and resized pieces are final sale."
              cta={{ href: '/returns', label: 'Read the return policy' }}
            />
          </FadeIn>
        </Container>
      </section>

      {/* ─── Concierge close ─── */}
      <ConciergeClose />
    </>
  )
}

function Pillar({
  title,
  body,
  cta,
}: {
  title: string
  body: string
  cta?: { href: string; label: string }
}) {
  return (
    <article>
      <h3 className="font-serif text-heading text-ink">{title}</h3>
      <p className="mt-4 max-w-sm text-body leading-relaxed text-ink-soft">
        {body}
      </p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-5 inline-block text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive hover:decoration-olive"
        >
          {cta.label} →
        </Link>
      ) : null}
    </article>
  )
}
