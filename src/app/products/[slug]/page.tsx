import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { ProductGallery } from '@/components/store/product-gallery'
import { ProductSpecs } from '@/components/store/product-specs'
import { AvailabilityPill } from '@/components/store/availability-pill'
import { AddToBagForm } from '@/components/store/add-to-bag-form'
import { PricePair } from '@/components/store/price'
import { RelatedProducts } from '@/components/store/related-products'
import { ConciergeClose } from '@/components/store/concierge-close'
import { ERA_LABELS } from '@/lib/products/eras'
import { policyShortText } from '@/lib/products/policy'
import { prisma } from '@/lib/prisma'
import type { ProductCardData } from '@/components/store/product-card'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

async function loadProduct(slug: string) {
  return prisma.product
    .findFirst({
      where: { slug, status: 'ACTIVE', isHidden: false },
      include: {
        images: { orderBy: { position: 'asc' } },
        materials: true,
        stones: true,
        collections: {
          include: {
            collection: {
              select: { slug: true, title: true, kind: true, isPublished: true },
            },
          },
        },
        _count: {
          select: {
            inventoryItems: { where: { status: 'AVAILABLE' } },
          },
        },
      },
    })
    .catch(() => null)
}

async function loadRelated(currentId: string, era: string): Promise<ProductCardData[]> {
  try {
    const items = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isHidden: false,
        // Cast in the where clause; Prisma narrows by enum value at runtime.
        era: era as 'VINTAGE_ERA' | 'NEAR_VINTAGE' | 'MODERN_FINE' | 'JADE',
        NOT: { id: currentId },
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: 4,
      select: {
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
      },
    })
    return items.map((p) => ({
      slug: p.slug,
      title: p.title,
      era: p.era,
      priceCents: p.priceCents,
      compareAtCents: p.compareAtCents,
      currency: p.currency,
      isFinalSale: p.isFinalSale,
      image: p.images[0] ?? null,
      availableCount: p._count.inventoryItems,
    }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) return {}

  const eraLabel = ERA_LABELS[product.era]
  const description =
    product.metaDescription ?? product.shortDescription ?? `${eraLabel} from the HV Jewelers archive.`
  const heroUrl = product.images[0]?.url

  return {
    title: product.metaTitle ?? `${product.title} · ${eraLabel}`,
    description,    openGraph: {
      title: product.title,
      description,
      type: 'website',
      url: `${SITE_URL}/products/${product.slug}`,
      images: heroUrl ? [{ url: heroUrl }] : undefined,
    },
  }
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const product = await loadProduct(slug)
  if (!product) notFound()

  const available = product._count.inventoryItems
  const eraLabel = ERA_LABELS[product.era]
  const heroImage = product.images[0]
  const policyText = policyShortText(product)

  // Derive availability state for the CTA
  const state = (() => {
    if (product.stockMode === 'MADE_TO_ORDER') return { kind: 'made-to-order' as const }
    if (available === 0) return { kind: 'sold' as const }
    if (available === 1) return { kind: 'last-one' as const }
    return { kind: 'available' as const, remaining: available }
  })()

  const availabilityKind: 'available' | 'last-one' | 'sold' | 'made-to-order' =
    state.kind === 'available'
      ? 'available'
      : state.kind === 'last-one'
        ? 'last-one'
        : state.kind === 'sold'
          ? 'sold'
          : 'made-to-order'

  const collections = product.collections
    .map((pc) => pc.collection)
    .filter((c) => c.isPublished)
  const primaryCollection = collections[0] ?? null

  const related = await loadRelated(product.id, product.era)

  // Product JSON-LD — only when there's at least one image (real product
  // schema requires an image). We never schema-tag a placeholder-only state.
  const ld = heroImage
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description:
          product.shortDescription ??
          product.longDescription?.slice(0, 280) ??
          eraLabel,
        image: product.images.map((i) => i.url),
        sku: product.id,
        brand: { '@type': 'Brand', name: 'HV Jewelers' },
        category: eraLabel,
        offers: {
          '@type': 'Offer',
          price: (product.priceCents / 100).toFixed(2),
          priceCurrency: product.currency,
          availability:
            available === 0
              ? 'https://schema.org/SoldOut'
              : 'https://schema.org/InStock',
          url: `${SITE_URL}/products/${product.slug}`,
          itemCondition:
            product.condition === 'NEW' || product.condition === 'NEW_OLD_STOCK'
              ? 'https://schema.org/NewCondition'
              : 'https://schema.org/UsedCondition',
        },
      }
    : null

  return (
    <>
      <Container className="pt-10">
        <Breadcrumbs
          items={[
            { label: 'HV Jewelers', href: '/' },
            { label: eraLabel, href: primaryCollection ? `/collections/${primaryCollection.slug}` : undefined },
            { label: product.title },
          ]}
        />
      </Container>

      {/* ─── Top split: gallery + detail ─── */}
      <Container className="pt-10 pb-16 md:pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <ProductGallery
            images={product.images.map((img) => ({
              url: img.url,
              alt: img.alt,
              width: img.width,
              height: img.height,
              caption: img.caption,
            }))}
            productTitle={product.title}
          />

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-eyebrow text-bronze">
              {eraLabel}
              {primaryCollection && primaryCollection.title !== eraLabel
                ? ` · ${primaryCollection.title}`
                : ''}
            </p>
            <h1 className="mt-5 font-serif text-display text-ink">
              {product.title}
            </h1>

            {product.shortDescription ? (
              <p className="mt-6 max-w-md text-body leading-relaxed text-ink-soft">
                {product.shortDescription}
              </p>
            ) : null}

            <div className="mt-8 flex items-baseline gap-4">
              <PricePair
                cents={product.priceCents}
                compareAtCents={product.compareAtCents}
                currency={product.currency}
                className="text-subtitle text-ink"
              />
              <AvailabilityPill kind={availabilityKind} />
            </div>

            <div className="mt-10">
              <AddToBagForm
                productId={product.id}
                productSlug={product.slug}
                state={state}
                errorCode={sp?.error ?? null}
              />
            </div>

            {product.isResizable ? (
              <div className="mt-10 border-t border-limestone-deep/60 pt-6">
                <p className="text-eyebrow text-ink-muted">Resizing</p>
                <p className="mt-3 max-w-md text-caption leading-relaxed text-ink-soft">
                  This piece can be resized.{' '}
                  {product.resizeNotes ?? 'Adds 7–10 days to fulfillment.'}{' '}
                  {product.resizeVoidsReturn
                    ? 'Resizing voids the return window.'
                    : null}{' '}
                  Write the{' '}
                  <Link
                    href="/contact"
                    className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
                  >
                    concierge
                  </Link>{' '}
                  to size before adding to bag.
                </p>
              </div>
            ) : null}

            <div className="mt-8 border-t border-limestone-deep/60 pt-6">
              <p className="text-eyebrow text-ink-muted">Policy</p>
              <p className="mt-3 max-w-md text-caption leading-relaxed text-ink-soft">
                {policyText}{' '}
                <Link
                  href="/returns"
                  className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
                >
                  Read returns
                </Link>
                {' · '}
                <Link
                  href="/shipping"
                  className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
                >
                  Read shipping
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </Container>

      {/* ─── Story (longer description) ─── */}
      {product.longDescription ? (
        <section className="border-t border-limestone-deep/60 bg-parchment">
          <Container className="py-20 md:py-28" width="reading">
            <p className="text-eyebrow text-ink-muted">About this piece</p>
            <div className="mt-8 space-y-6 text-body leading-[1.8] text-ink-soft">
              {product.longDescription
                .split(/\n\n+/)
                .filter((p) => p.trim().length > 0)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph.trim()}</p>
                ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ─── Specifications ─── */}
      <section className="border-t border-limestone-deep/60">
        <Container className="py-20 md:py-28">
          <p className="text-eyebrow text-ink-muted">Specifications</p>
          <h2 className="mt-4 max-w-2xl font-serif text-display text-ink">
            What this piece is.
          </h2>
          <div className="mt-14">
            <ProductSpecs
              data={{
                goldKarat: product.goldKarat,
                gramWeight: product.gramWeight ? Number(product.gramWeight) : null,
                gramWeightVisible: product.gramWeightVisible,
                ringSize: product.ringSize,
                dimensionsText: product.dimensionsText,
                condition: product.condition,
                conditionNotes: product.conditionNotes,
                signed: product.signed,
                signedNotes: product.signedNotes,
                provenance: product.provenance,
                materials: product.materials.map((m) => ({
                  kind: m.kind,
                  notes: m.notes,
                })),
                stones: product.stones.map((s) => ({
                  kind: s.kind,
                  caratWeight: s.caratWeight ? Number(s.caratWeight) : null,
                  count: s.count,
                  notes: s.notes,
                })),
              }}
            />
          </div>
        </Container>
      </section>

      {/* ─── Care band ─── */}
      <section className="border-t border-limestone-deep/60 bg-limestone/40">
        <Container className="py-20 md:py-24">
          <div className="grid gap-10 md:grid-cols-3">
            <CareLink
              eyebrow="How it ships"
              title="Insured. Signed for."
              body="Domestic only at launch, fully insured, signature on delivery."
              href="/shipping"
            />
            <CareLink
              eyebrow="Return policy"
              title={product.isFinalSale ? 'Final sale' : `${product.returnWindowDays}-day return`}
              body={
                product.isFinalSale
                  ? 'Vintage Era and Near Vintage pieces are final sale.'
                  : 'Eligible for unworn returns within the listed window.'
              }
              href="/returns"
            />
            <CareLink
              eyebrow="Care notes"
              title="Worn slowly, kept softly."
              body="Notes on gold, pearls, and modern fine jewelry."
              href="/care"
            />
          </div>
        </Container>
      </section>

      {/* ─── Related ─── */}
      <RelatedProducts
        eyebrow="Pieces in conversation"
        title={`More from ${eraLabel}.`}
        items={related}
        ctaHref={primaryCollection ? `/collections/${primaryCollection.slug}` : `/collections/new-arrivals`}
        ctaLabel="See the collection"
      />

      <ConciergeClose />

      {ld ? (
        <Script
          id="product-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ) : null}
    </>
  )
}

function CareLink({
  eyebrow,
  title,
  body,
  href,
}: {
  eyebrow: string
  title: string
  body: string
  href: string
}) {
  return (
    <Link href={href} className="group block">
      <p className="text-eyebrow text-bronze">{eyebrow}</p>
      <h3 className="mt-3 font-serif text-title text-ink transition-colors duration-300 group-hover:text-olive">
        {title}
      </h3>
      <p className="mt-3 max-w-sm text-caption leading-relaxed text-ink-soft">
        {body}
      </p>
      <p className="mt-3 text-caption tracking-wide text-ink-soft transition-colors duration-300 group-hover:text-olive">
        Read →
      </p>
    </Link>
  )
}
