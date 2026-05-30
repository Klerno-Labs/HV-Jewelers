import Image from 'next/image'
import Link from 'next/link'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { formatMoney, moneyToCents } from '@/lib/shopify/money'

/**
 * Product card for Shopify-backed /shop pages. Mirrors the visual
 * conventions of the existing Prisma ProductCard but links to
 * /shop/[handle] and reads from Shopify product shape.
 */
export function ShopProductCard({ product }: { product: ShopifyProduct }) {
  const image = product.featuredImage
  const priceCents = moneyToCents(product.priceRange.minVariantPrice)
  const compareCents = product.compareAtPriceRange?.minVariantPrice
    ? moneyToCents(product.compareAtPriceRange.minVariantPrice)
    : null
  const onSale = compareCents != null && compareCents > priceCents
  const eyebrow =
    product.productType || product.vendor || 'HV Jewelers'

  const showOneOnly =
    product.totalInventory != null &&
    product.totalInventory === 1 &&
    product.availableForSale
  const showSold =
    !product.availableForSale ||
    (product.totalInventory != null && product.totalInventory <= 0)

  // Visually-hidden state prefix folded into the link's text content so
  // screen readers read e.g. "Sold. Gold signet ring. HV Jewelers. $420."
  // Image alt is empty when Shopify provides no altText so the title is
  // not announced twice.
  const statePrefix = showSold
    ? 'Sold. '
    : showOneOnly
      ? 'One only. '
      : onSale
        ? 'On sale. '
        : ''

  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group block"
    >
      {statePrefix && <span className="sr-only">{statePrefix}</span>}
      <div className="relative aspect-[4/5] overflow-hidden bg-limestone">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? ''}
            width={image.width ?? 800}
            height={image.height ?? 1000}
            sizes="(min-width: 1280px) 320px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-[800ms] ease-[var(--ease-quiet)] group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--color-parchment-warm)_0%,var(--color-limestone)_60%,var(--color-limestone-deep)_100%)]">
            <span className="absolute inset-0 flex items-center justify-center font-serif text-display text-ink/30">
              {product.title.charAt(0)}
            </span>
          </div>
        )}

        {(showOneOnly || showSold || onSale) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {showSold && (
              <span className="bg-ink/85 px-2 py-1 text-eyebrow text-parchment">
                Sold
              </span>
            )}
            {showOneOnly && !showSold && (
              <span className="bg-parchment/95 px-2 py-1 text-eyebrow text-ink">
                One only
              </span>
            )}
            {onSale && !showSold && (
              <span className="bg-greek-terracotta/95 px-2 py-1 text-eyebrow text-parchment">
                On sale
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 px-1">
        <p className="text-eyebrow text-bronze">{eyebrow}</p>
        <h3 className="mt-2 font-serif text-title text-ink transition-colors duration-300 group-hover:text-olive-deep">
          {product.title}
        </h3>
        <p className="mt-1.5 text-caption text-ink-soft tabular-nums">
          {onSale && compareCents != null ? (
            <>
              <span className="line-through decoration-bronze/50 text-ink-muted mr-2">
                {formatMoney({
                  amount: (compareCents / 100).toFixed(2),
                  currencyCode: product.priceRange.minVariantPrice.currencyCode,
                })}
              </span>
              {formatMoney(product.priceRange.minVariantPrice)}
            </>
          ) : (
            formatMoney(product.priceRange.minVariantPrice)
          )}
        </p>
      </div>
    </Link>
  )
}
