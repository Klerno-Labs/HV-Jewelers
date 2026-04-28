import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'
import { Manifesto } from '@/components/store/manifesto'
import { WorldFeature } from '@/components/store/world-feature'
import { JournalPreview } from '@/components/store/journal-preview'
import { ConciergeClose } from '@/components/store/concierge-close'
import { FadeIn } from '@/components/store/fade-in'
import { cn } from '@/lib/cn'
import { prisma } from '@/lib/prisma'
import { ProductCard, type ProductCardData } from '@/components/store/product-card'

/**
 * The editorial home. Reads a small set of products and journal posts;
 * gracefully falls back to typography-only treatment when data is
 * missing so the page is always coherent.
 */

const PRODUCT_SELECT = {
  slug: true,
  title: true,
  era: true,
  priceCents: true,
  compareAtCents: true,
  currency: true,
  isFinalSale: true,
  images: {
    orderBy: { position: 'asc' },
    take: 1,
    select: { url: true, alt: true, width: true, height: true },
  },
  _count: {
    select: { inventoryItems: { where: { status: 'AVAILABLE' } } },
  },
} as const

async function loadHomeData() {
  try {
    const [vintageProducts, modernProducts, newArrivals, posts] =
      await Promise.all([
        prisma.product.findMany({
          where: {
            status: 'ACTIVE',
            isHidden: false,
            era: 'VINTAGE_ERA',
          },
          orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
          take: 4,
          select: PRODUCT_SELECT,
        }),
        prisma.product.findMany({
          where: {
            status: 'ACTIVE',
            isHidden: false,
            era: 'MODERN_FINE',
          },
          orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
          take: 4,
          select: PRODUCT_SELECT,
        }),
        prisma.product.findMany({
          where: {
            status: 'ACTIVE',
            isHidden: false,
            isNewArrival: true,
          },
          orderBy: [{ publishedAt: 'desc' }],
          take: 4,
          select: PRODUCT_SELECT,
        }),
        prisma.editorialPost.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
          take: 2,
          select: {
            slug: true,
            title: true,
            excerpt: true,
            publishedAt: true,
            heroImageUrl: true,
          },
        }),
      ])
    return { vintageProducts, modernProducts, newArrivals, posts }
  } catch {
    return {
      vintageProducts: [],
      modernProducts: [],
      newArrivals: [],
      posts: [],
    }
  }
}

function toCard(p: {
  slug: string
  title: string
  era: ProductCardData['era']
  priceCents: number
  compareAtCents: number | null
  currency: string
  isFinalSale: boolean
  images: { url: string; alt: string | null; width: number | null; height: number | null }[]
  _count: { inventoryItems: number }
}): ProductCardData {
  return {
    slug: p.slug,
    title: p.title,
    era: p.era,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    currency: p.currency,
    isFinalSale: p.isFinalSale,
    image: p.images[0] ?? null,
    availableCount: p._count.inventoryItems,
  }
}

export default async function Home() {
  const data = await loadHomeData()

  const vintage = data.vintageProducts.map(toCard)
  const modern = data.modernProducts.map(toCard)
  const arrivals = data.newArrivals.map(toCard)

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
              Vintage Era and modern fine jewelry. Every piece unworn.
            </h1>
            <p className="mt-10 max-w-xl text-subtitle leading-relaxed text-ink-soft">
              Older-era pieces that were made but never sold, alongside
              modern fine jewelry made fresh on the bench. None of it
              has been worn before.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-4">
              <Link
                href="/collections/new-arrivals"
                className={cn(buttonVariants({ variant: 'primary', size: 'lg' }))}
              >
                See New Arrivals
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
                href="/collections/vintage-era"
                className="text-eyebrow text-bronze underline underline-offset-4 decoration-bronze/60 hover:text-olive"
              >
                Enter the archive →
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ─── Manifesto ─── */}
      <Manifesto />

      {/* ─── World 01 — Vintage Era ─── */}
      <WorldFeature
        eyebrow="Vintage Era"
        title="Older pieces, never worn."
        body="Signets, bands, brooches, and fine chain from the 1980s and 1990s. Made then, kept in jewelry store inventory, never sold to a customer. We verify each piece in person and describe exactly what we see: stamps, finish, and the small marks long storage leaves. We don't polish or restore. Vintage Era pieces are final sale, so the description has to do the work."
        href="/collections/vintage-era"
        ctaLabel="See the archive"
        tone="cedar"
        preview={vintage}
      />

      {/* ─── World 02 — Modern Fine ─── */}
      <WorldFeature
        eyebrow="Modern Fine Jewelry"
        title="New pieces, made to wear daily."
        body="Bands, solitaires, and everyday gold made fresh on the bench. Most pieces are eligible for a 15-day return on unworn returns. Resizing voids that window, so size before you buy."
        href="/collections/modern-fine-jewelry"
        ctaLabel="See the modern bench"
        imageReversed
        tone="bronze"
        preview={modern}
      />

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
                href="/collections/new-arrivals"
                className="hidden text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive md:inline"
              >
                See all →
              </Link>
            </FadeIn>
            <FadeIn delay={150} className="mt-14">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
                {arrivals.map((p) => (
                  <li key={p.slug}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </FadeIn>
          </Container>
        </section>
      ) : null}

      {/* ─── Journal preview ─── */}
      <JournalPreview posts={data.posts} />

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
              body="A lot of what we sell is unsigned. We talk about the metal, the carve, and the stone before we talk about who made it. If we can't verify a claim about a piece, we don't make it."
            />
            <Pillar
              title="Insured, signed for"
              body="Every package ships fully insured with signature required on delivery. Pieces over $5,000 ship adult-signature required."
              cta={{ href: '/shipping', label: 'How shipping works' }}
            />
            <Pillar
              title="Plain about returns"
              body="Vintage Era and Near Vintage pieces are final sale. Modern Fine pieces have a 15-day return window on unworn returns. Resizing a piece voids that window."
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
