import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Hero } from '@/components/store/hero'
import { Manifesto } from '@/components/store/manifesto'
import { WorldFeature } from '@/components/store/world-feature'
import { ConciergeClose } from '@/components/store/concierge-close'
import { GoogleReviews } from '@/components/store/google-reviews'
import { FadeIn } from '@/components/store/fade-in'
import { ShopProductCard } from '@/components/shop/shop-product-card'
import { listProducts } from '@/lib/shopify/products'
import { moneyToCents } from '@/lib/shopify/money'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Map a ranked product to the WorldFeature panel's image + link, so the two
 * editorial panels show real pieces and fall back to their gradient when the
 * catalog is too small to fill them.
 */
function panelImage(p: ShopifyProduct | undefined) {
  const img = p?.featuredImage
  if (!p || !img) return { image: null, imageHref: undefined }
  return {
    image: {
      url: img.url,
      alt: img.altText ?? p.title,
      width: img.width ?? 1000,
      height: img.height ?? 1250,
    },
    imageHref: `/shop/${p.handle}`,
  }
}

function isHomepageFeature(product: ShopifyProduct): boolean {
  return product.tags.some((tag) =>
    ['featured', 'homepage-feature'].includes(tag.trim().toLowerCase()),
  )
}

/**
 * The editorial home reads directly from Shopify. The owner can explicitly
 * choose the hero with a `Featured` or `homepage-feature` tag. Without that
 * tag, the page favors a photographed, mid-ticket piece rather than
 * automatically putting the most expensive item in front of every new
 * visitor. Statement pieces remain prominent immediately below it.
 */
export default async function Home() {
  const { products } = await listProducts(50)

  const available = products
    .filter((product) => product.availableForSale)
    .sort(
      (a, b) =>
        moneyToCents(b.priceRange.minVariantPrice) -
        moneyToCents(a.priceRange.minVariantPrice),
    )

  const explicitlyFeatured = available.find(isHomepageFeature)
  const approachable = available
    .filter((product) => {
      const cents = moneyToCents(product.priceRange.minVariantPrice)
      return product.featuredImage && cents >= 100_000 && cents <= 300_000
    })
    .sort(
      (a, b) =>
        Math.abs(moneyToCents(a.priceRange.minVariantPrice) - 180_000) -
        Math.abs(moneyToCents(b.priceRange.minVariantPrice) - 180_000),
    )

  const feature =
    explicitlyFeatured ?? approachable[0] ?? available[0] ?? products[0] ?? null
  const remaining = feature
    ? available.filter((product) => product.id !== feature.id)
    : available

  const collection = remaining.slice(2, 6)
  const bench = remaining.slice(6, 10)
  const arrivals = remaining.slice(10, 14)

  return (
    <>
      <Hero feature={feature} />

      <Manifesto />

      <WorldFeature
        eyebrow="The Collection"
        title="Chosen with restraint."
        body="A small, edited selection of fine jewelry: necklaces, earrings, rings, and bracelets. We stock a single piece of each design and describe it plainly: the metal, the stone, the finish. We'd rather carry less and know it well."
        href="/shop"
        ctaLabel="See the collection"
        tone="cedar"
        {...panelImage(remaining[0])}
      />
      {collection.length > 0 ? (
        <section className="border-t border-limestone-deep/60">
          <Container className="py-16 md:py-20">
            <FadeIn>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
                {collection.map((product) => (
                  <li key={product.id}>
                    <ShopProductCard product={product} />
                  </li>
                ))}
              </ul>
            </FadeIn>
          </Container>
        </section>
      ) : null}

      <WorldFeature
        eyebrow="On the Bench"
        title="Made to wear, every day."
        body="Gold for every day, chosen to be worn and kept. Most pieces are eligible for a 15-day return in original, unused condition. Resizing voids that window, so size before you buy."
        href="/shop"
        ctaLabel="See the bench"
        imageReversed
        tone="bronze"
        {...panelImage(remaining[1])}
      />
      {bench.length > 0 ? (
        <section className="border-t border-limestone-deep/60">
          <Container className="py-16 md:py-20">
            <FadeIn>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
                {bench.map((product) => (
                  <li key={product.id}>
                    <ShopProductCard product={product} />
                  </li>
                ))}
              </ul>
            </FadeIn>
          </Container>
        </section>
      ) : null}

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
                {arrivals.map((product) => (
                  <li key={product.id}>
                    <ShopProductCard product={product} />
                  </li>
                ))}
              </ul>
            </FadeIn>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-limestone-deep/60 bg-limestone/40">
        <Container className="py-24 md:py-28">
          <FadeIn>
            <p className="text-center text-eyebrow text-ink-muted">
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

      <GoogleReviews />

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
