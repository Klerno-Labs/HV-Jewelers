import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { CollectionHero } from '@/components/store/collection-hero'
import { ProductGrid } from '@/components/store/product-grid'
import { FilterBar } from '@/components/store/filter-bar'
import { EmptyState } from '@/components/store/empty-state'
import { prisma } from '@/lib/prisma'
import { getCollectionMeta, PUBLIC_COLLECTION_SLUGS } from '@/lib/store/collections'
import {
  parseFilters,
  productOrderByForFilters,
  productWhereForFilters,
} from '@/lib/store/filters'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({
  params,
}: {
  params: PageProps['params']
}): Promise<Metadata> {
  const { slug } = await params
  const meta = getCollectionMeta(slug)
  if (!meta) return {}
  return {
    title: meta.title,
    description: meta.intro.slice(0, 160),  }
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const meta = getCollectionMeta(slug)
  if (!meta || !PUBLIC_COLLECTION_SLUGS.includes(slug)) notFound()

  const collection = await prisma.collection
    .findFirst({
      where: { slug, isPublished: true },
      select: { id: true, slug: true, title: true },
    })
    .catch(() => null)

  if (!collection) {
    // No DB row yet — render the editorial frame with a graceful empty
    // state so the page still feels finished while seed data lands.
    return (
      <>
        <Container className="pt-10">
          <Breadcrumbs
            items={[
              { label: 'HV Jewelers', href: '/' },
              { label: meta.title },
            ]}
          />
          <CollectionHero meta={meta} count={0} className="mt-10" />
        </Container>
        <Container>
          <EmptyState
            eyebrow="Quiet for now"
            title="This collection is being built."
            body="We add small, considered sets every few weeks. Check back soon, or read the journal in the meantime."
            action={{ label: 'Read the Journal', href: '/journal' }}
          />
        </Container>
      </>
    )
  }

  const filters = parseFilters(sp)
  const where = {
    ...productWhereForFilters(filters),
    collections: { some: { collectionId: collection.id } },
  }

  const [products, totalUnfiltered] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: productOrderByForFilters(filters),
      select: {
        id: true,
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
      take: 96,
    }),
    prisma.product.count({
      where: {
        status: 'ACTIVE',
        isHidden: false,
        collections: { some: { collectionId: collection.id } },
      },
    }),
  ])

  const cards = products.map((p) => ({
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

  const isFiltered =
    Boolean(filters.metal) ||
    Boolean(filters.stone) ||
    Boolean(filters.available) ||
    (filters.sort && filters.sort !== 'featured')

  return (
    <>
      <Container className="pt-10">
        <Breadcrumbs
          items={[
            { label: 'HV Jewelers', href: '/' },
            { label: meta.title },
          ]}
        />
        <CollectionHero meta={meta} count={totalUnfiltered} className="mt-10" />
      </Container>

      <Container>
        <FilterBar basePath={`/collections/${slug}`} filters={filters} />
      </Container>

      <Container className="py-16 md:py-20">
        {cards.length === 0 ? (
          <EmptyState
            eyebrow="No matches"
            title={
              isFiltered
                ? 'Nothing in this slice yet.'
                : 'Pieces are on their way.'
            }
            body={
              isFiltered
                ? 'Try widening the filters, or browse the full collection.'
                : 'A new set is being prepared for this collection. Check back soon.'
            }
            action={
              isFiltered
                ? { label: 'Clear filters', href: `/collections/${slug}` }
                : { label: 'Read the Journal', href: '/journal' }
            }
          />
        ) : (
          <ProductGrid products={cards} />
        )}
      </Container>
    </>
  )
}
