import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { EmptyState } from '@/components/store/empty-state'
import { FadeIn } from '@/components/store/fade-in'
import { ShopBrowser } from '@/components/shop/shop-browser'
import { listAllProducts } from '@/lib/shopify/products'
import { moneyToCents } from '@/lib/shopify/money'
import { getImageTiles } from '@/lib/image-bg'
import { buildCollections, findCollection } from '@/lib/shopify/collections'
import { deriveFacets, matchesFilters } from '@/lib/shopify/facets'

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hvjewelers.com'
).replace(/\/$/, '')

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const products = await listAllProducts()
  const collection = findCollection(products, slug)
  if (!collection) return { title: 'Not found' }

  return {
    title: collection.title,
    description: collection.description,
    alternates: { canonical: `${SITE_URL}/collections/${collection.slug}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/collections/${collection.slug}`,
      title: `${collection.title} | HV Jewelers`,
      description: collection.description,
    },
  }
}

export async function generateStaticParams() {
  const products = await listAllProducts()
  return buildCollections(products).map((collection) => ({
    slug: collection.slug,
  }))
}

export const revalidate = 600

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params
  const products = await listAllProducts()
  const collection = findCollection(products, slug)
  if (!collection) notFound()

  const ranked = [...products].sort((a, b) => {
    if (a.availableForSale !== b.availableForSale) {
      return a.availableForSale ? -1 : 1
    }
    return (
      moneyToCents(b.priceRange.minVariantPrice) -
      moneyToCents(a.priceRange.minVariantPrice)
    )
  })

  const members = ranked.filter((product) =>
    matchesFilters(deriveFacets(product), collection.filters),
  )
  const imageTiles = await getImageTiles(
    members.flatMap((product) =>
      product.featuredImage ? [product.featuredImage.url] : [],
    ),
  )

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${collection.title} | HV Jewelers`,
    description: collection.description,
    url: `${SITE_URL}/collections/${collection.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: members.length,
      itemListElement: members.slice(0, 24).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/shop/${product.handle}`,
        name: product.title,
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <Container className="pt-10">
        <Breadcrumbs
          items={[
            { label: 'HV Jewelers', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: collection.title },
          ]}
        />
      </Container>

      <section>
        <Container className="py-16 md:py-20">
          <FadeIn>
            <p className="text-eyebrow text-bronze">A Collection</p>
            <h1 className="mt-8 max-w-[18ch] font-serif text-display-lg font-light italic leading-[1.05] text-ink">
              {collection.title}
            </h1>
            <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
              {collection.description}
            </p>
            {collection.evergreen ? (
              <p className="mt-5 max-w-xl text-caption leading-relaxed text-ink-muted">
                This collection remains available as single-piece inventory
                changes, so saved links continue to lead somewhere useful.
              </p>
            ) : null}
          </FadeIn>
        </Container>
      </section>

      <Container className="pb-16 md:pb-20">
        {members.length > 0 ? (
          <ShopBrowser
            products={ranked}
            imageTiles={imageTiles}
            initialFilters={collection.filters}
          />
        ) : (
          <EmptyState
            eyebrow="Sourcing now"
            title="Nothing in this collection today."
            body="Our inventory is one piece per design. Ask the showroom to source something similar, or browse the full case while this collection is replenished."
            action={{ label: 'Ask the showroom →', href: '/contact' }}
          />
        )}
      </Container>

      <Container className="pb-24">
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-limestone-deep/60 pt-10 text-caption tracking-wide">
          <Link
            href="/shop"
            className="text-ink underline decoration-bronze/60 underline-offset-4 hover:text-olive hover:decoration-olive"
          >
            Browse the full case →
          </Link>
          <Link
            href="/contact"
            className="text-ink underline decoration-bronze/60 underline-offset-4 hover:text-olive hover:decoration-olive"
          >
            Request a similar piece →
          </Link>
        </div>
      </Container>
    </>
  )
}
