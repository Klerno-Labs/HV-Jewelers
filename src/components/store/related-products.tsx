import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { ProductCard, type ProductCardData } from './product-card'

export function RelatedProducts({
  eyebrow = 'Pieces in conversation',
  title,
  items,
  ctaHref,
  ctaLabel = 'See more',
}: {
  eyebrow?: string
  title: string
  items: ProductCardData[]
  ctaHref?: string
  ctaLabel?: string
}) {
  if (items.length === 0) return null
  return (
    <section className="border-t border-limestone-deep/60 bg-parchment">
      <Container className="py-20 md:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-eyebrow text-ink-muted">{eyebrow}</p>
            <h2 className="mt-4 font-serif text-display text-ink">{title}</h2>
          </div>
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="hidden text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive md:inline"
            >
              {ctaLabel} →
            </Link>
          ) : null}
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
