import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { FadeIn } from '@/components/store/fade-in'
import { ShopBrowser } from '@/components/shop/shop-browser'
import { listAllProducts } from '@/lib/shopify/products'
import { moneyToCents } from '@/lib/shopify/money'
import { getImageTiles } from '@/lib/image-bg'
import { buildCollections, findCollection } from '@/lib/shopify/collections'
import { deriveFacets, matchesFilters } from '@/lib/shopify/facets'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

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
    // Unlike the ?facet= shop views, which canonicalize back to /shop, a
    // collection is its own indexable page — that is the point of it.
    alternates: { canonical: `${SITE_URL}/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.title} · HV Jewelers`,
      description: collection.description,
    },
  }
}

export async function generateStaticParams() {
  const products = await listAllProducts()
  return buildCollections(products).map((c) => ({ slug: c.slug }))
}

// Membership follows stock: when a piece sells, every collection page that
// held it drops it on the next revalidation rather than showing a dead tile.
export const revalidate = 600

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params
  const products = await listAllProducts()
  const collection = findCollection(products, slug)
  if (!collection) notFound()

  // Same merchandising order as /shop: in-stock first, then price descending.
  const ranked = [...products].sort((a, b) => {
    if (a.availableForSale !== b.availableForSale)
      return a.availableForSale ? -1 : 1
    return (
      moneyToCents(b.priceRange.minVariantPrice) -
      moneyToCents(a.priceRange.minVariantPrice)
    )
  })

  const members = ranked.filter((p) =>
    matchesFilters(deriveFacets(p), collection.filters),
  )
  const imageTiles = await getImageTiles(
    ranked.flatMap((p) => (p.featuredImage ? [p.featuredImage.url] : [])),
  )

  // ItemList structured data: tells search engines this page is a curated
  // list of the products it links, which is what earns collection results.
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${collection.title} · HV Jewelers`,
    description: collection.description,
    url: `${SITE_URL}/collections/${collection.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: members.length,
      itemListElement: members.slice(0, 24).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/shop/${p.handle}`,
        name: p.title,
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
          </FadeIn>
        </Container>
      </section>

      <Container className="pb-16 md:pb-20">
        <ShopBrowser
          products={ranked}
          imageTiles={imageTiles}
          initialFilters={collection.filters}
        />
      </Container>

      <Container className="pb-24">
        <div className="border-t border-limestone-deep/60 pt-10">
          <Link
            href="/shop"
            className="text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
          >
            Browse the full case →
          </Link>
        </div>
      </Container>
    </>
  )
}
