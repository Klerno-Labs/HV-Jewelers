import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'
import { Manifesto } from '@/components/store/manifesto'
import { WorldFeature } from '@/components/store/world-feature'
import { ConciergeClose } from '@/components/store/concierge-close'
import { FadeIn } from '@/components/store/fade-in'
import { ShopProductCard } from '@/components/shop/shop-product-card'
import { cn } from '@/lib/cn'
import { listProducts } from '@/lib/shopify/products'

/**
 * The editorial home. Reads up to 12 Shopify products and slices them
 * across the two World features and the New Arrivals grid. Falls back
 * to typography-only treatment when no products are configured yet,
 * so the page is always coherent.
 *
 * TODO once Shopify products carry section tags, replace the slice()
 * with tag-filtered `listProducts` calls so each section pulls its own
 * set. The final section taxonomy is a merchandising decision — see the
 * vision doc.
 */
export default async function Home() {
  const { products } = await listProducts(12)
  const collection = products.slice(0, 4)
  const bench = products.slice(4, 8)
  const arrivals = products.slice(8, 12)

  return (
    <>
      {/* ─── Editorial hero ─── */}
      <section
        aria-labelledby="intro-heading"
        className="relative overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full md:w-[55%]"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-greek-teal)_18%,var(--color-limestone-deep))_0%,var(--color-parchment)_55%,transparent_85%)]" />
        </div>
        <Container className="grid gap-12 py-24 md:py-32 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16 lg:py-40">
          <FadeIn>
            <p className="text-eyebrow text-bronze">Hoang Vi Jewelers</p>
            <h1
              id="intro-heading"
              className="mt-10 max-w-[18ch] font-serif text-display-lg font-light italic leading-[1.02] text-ink"
            >
              Fine jewelry, chosen and verified in person.
            </h1>
            <p className="mt-10 max-w-xl text-subtitle leading-relaxed text-ink-soft">
              Bands, solitaires, everyday gold, and stones — a small,
              considered collection, each piece looked at in person before
              it goes on the site.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-4">
              <Link
                href="/shop"
                className={cn(buttonVariants({ variant: 'primary', size: 'lg' }))}
              >
                Enter the shop
              </Link>
              <Link
                href="/about"
                className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }))}
              >
                About the House →
              </Link>
            </div>
          </FadeIn>

          <FadeIn
            delay={200}
            className="relative aspect-4/5 overflow-hidden lg:aspect-3/4"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,var(--color-greek-terracotta)_55%,var(--color-cedar-soft))_0%,var(--color-temple-stone)_55%,var(--color-parchment-warm)_100%)]"
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <p className="font-serif text-eyebrow text-bronze">
                Currently in the case
              </p>
              <Link
                href="/shop"
                className="text-eyebrow text-bronze underline underline-offset-4 decoration-bronze/60 hover:text-olive"
              >
                Browse the shop →
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

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
                <p className="text-eyebrow text-ink-muted">Most Recent</p>
                <h2 className="mt-4 font-serif text-display text-ink">
                  Newly added.
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
              body="Most pieces are eligible for a 15-day return in original, unused condition. Custom, engraved, and resized pieces are final sale."
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
