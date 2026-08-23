import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { FadeIn } from '@/components/store/fade-in'
import { listAllProducts } from '@/lib/shopify/products'
import { buildCollections } from '@/lib/shopify/collections'

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Browse HV Jewelers by stone, metal, category, and budget. Fine jewelry, one piece per design.',
}

export const revalidate = 600

export default async function CollectionsIndexPage() {
  const products = await listAllProducts()
  const collections = buildCollections(products)

  return (
    <>
      <Container className="pt-10">
        <Breadcrumbs
          items={[{ label: 'HV Jewelers', href: '/' }, { label: 'Collections' }]}
        />
      </Container>

      <Container className="py-16 md:py-20">
        <FadeIn>
          <p className="text-eyebrow text-bronze">Browse the case</p>
          <h1 className="mt-8 font-serif text-display-lg font-light italic leading-[1.05] text-ink">
            Collections
          </h1>
        </FadeIn>

        <ul className="mt-12 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/collections/${c.slug}`}
                className="group flex items-baseline justify-between gap-4 border-b border-limestone-deep/40 py-3"
              >
                <span className="text-body text-ink group-hover:text-olive">
                  {c.title}
                </span>
                <span className="text-caption text-ink-muted">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  )
}
