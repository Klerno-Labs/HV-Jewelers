import Link from 'next/link'
import Image from 'next/image'
import type { ProductEra } from '@prisma/client'
import { ERA_LABELS } from '@/lib/products/eras'
import { PricePair } from './price'

export interface ProductCardData {
  slug: string
  title: string
  era: ProductEra
  priceCents: number
  compareAtCents: number | null
  currency: string
  image: { url: string; alt: string | null; width: number | null; height: number | null } | null
  /// When known, surfaces "Last one" or "Sold" copy. Pass null to hide.
  availableCount?: number | null
  isFinalSale: boolean
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const eraLabel = ERA_LABELS[product.era]
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block focus-visible:outline-none"
      aria-label={`${product.title}, ${eraLabel}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-limestone">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt ?? product.title}
            width={product.image.width ?? 800}
            height={product.image.height ?? 1000}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder title={product.title} />
        )}
        <AvailabilityChip
          availableCount={product.availableCount}
          isFinalSale={product.isFinalSale}
        />
      </div>
      <div className="mt-5">
        <p className="text-eyebrow text-ink-muted">{eraLabel}</p>
        <p className="mt-2 font-serif text-title text-ink transition-colors duration-300 group-hover:text-olive-deep">
          {product.title}
        </p>
        <PricePair
          cents={product.priceCents}
          compareAtCents={product.compareAtCents}
          currency={product.currency}
          className="mt-2 block text-caption text-ink-soft"
        />
      </div>
    </Link>
  )
}

function ImagePlaceholder({ title }: { title: string }) {
  // Editorial-safe neutral placeholder: a parchment gradient + initial.
  // No dependence on a real asset URL while we await photography.
  const initial = title.trim().charAt(0).toUpperCase() || '·'
  return (
    <div
      aria-hidden
      className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,var(--color-parchment-warm)_0%,var(--color-limestone)_70%)]"
    >
      <span className="font-serif text-display text-bronze/40">{initial}</span>
    </div>
  )
}

function AvailabilityChip({
  availableCount,
  isFinalSale,
}: {
  availableCount?: number | null
  isFinalSale: boolean
}) {
  if (availableCount === 0) {
    return (
      <span className="absolute left-3 top-3 bg-ink/85 px-2.5 py-1 text-eyebrow text-parchment">
        Sold
      </span>
    )
  }
  if (availableCount === 1) {
    return (
      <span className="absolute left-3 top-3 bg-parchment/90 px-2.5 py-1 text-eyebrow text-bronze">
        One only
      </span>
    )
  }
  if (isFinalSale && (availableCount ?? 1) > 0) {
    return (
      <span className="absolute right-3 top-3 bg-parchment/90 px-2.5 py-1 text-eyebrow text-ink-muted">
        Final sale
      </span>
    )
  }
  return null
}
