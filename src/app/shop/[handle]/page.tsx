import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { ProductGallery, type GalleryMedia } from '@/components/store/product-gallery'
import { ConciergeClose } from '@/components/store/concierge-close'
import { AddToShopCartForm } from '@/components/shop/add-to-shop-cart-form'
import { getProductByHandle, listProductHandles } from '@/lib/shopify/products'
import { formatMoney, moneyToCents } from '@/lib/shopify/money'
import { sanitizeShopifyHtml } from '@/lib/shopify/html'
import { getImageBgColors } from '@/lib/image-bg'
import { facetLinks } from '@/lib/shopify/facets'

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) {
    return { title: 'Not found' }
  }
  return {
    title: product.title,
    description: product.description?.slice(0, 160) ?? 'HV Jewelers',
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 200) ?? '',
      images: product.featuredImage?.url ? [product.featuredImage.url] : undefined,
    },
  }
}

export async function generateStaticParams() {
  const handles = await listProductHandles(100)
  return handles.map((h) => ({ handle: h.handle }))
}

export const revalidate = 600

export default async function ShopProductPage({ params }: PageProps) {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) notFound()

  // Product Rich Pin metadata. Pinterest reads these Open Graph tags to show
  // live price and availability on the pin itself; the JSON-LD below the fold
  // carries the same facts for search engines. React 19 hoists meta tags
  // rendered anywhere in the tree into <head>, and Next's typed metadata API
  // has no "product" og:type, which is why these are plain elements.
  const priceAmount = product.priceRange.minVariantPrice?.amount
  const priceCurrency = product.priceRange.minVariantPrice?.currencyCode
  const availability = product.availableForSale ? 'instock' : 'out of stock'

  const galleryMedia: GalleryMedia[] =
    product.media.length > 0
      ? product.media.map((m) => {
          if (m.mediaType === 'video') {
            // Prefer a progressive mp4 source; Shopify also returns HLS
            // (.m3u8) which a bare <video> can't play without hls.js.
            const best = m.sources.find((s) => s.mimeType === 'video/mp4') ?? m.sources[0]
            return {
              kind: 'video' as const,
              src: best?.url ?? '',
              mimeType: best?.mimeType ?? 'video/mp4',
              poster: m.previewImage?.url ?? null,
              alt: m.altText,
              width: best?.width ?? m.previewImage?.width ?? null,
              height: best?.height ?? m.previewImage?.height ?? null,
            }
          }
          return {
            kind: 'image' as const,
            url: m.url,
            alt: m.altText,
            width: m.width,
            height: m.height,
          }
        })
      : (product.images.length > 0
          ? product.images
          : product.featuredImage
            ? [product.featuredImage]
            : []
        ).map((img) => ({
          kind: 'image' as const,
          url: img.url,
          alt: img.altText,
          width: img.width,
          height: img.height,
        }))

  // Paint each gallery frame with its own photo's sampled background tone
  // (see lib/image-bg) so contained photos blend instead of floating.
  const imageBgs = await getImageBgColors(
    galleryMedia.flatMap((m) => (m.kind === 'image' ? [m.url] : [])),
  )
  const media: GalleryMedia[] = galleryMedia.map((m) =>
    m.kind === 'image' ? { ...m, bg: imageBgs[m.url] ?? null } : m,
  )

  const priceMin = moneyToCents(product.priceRange.minVariantPrice)
  const compareMin = product.compareAtPriceRange?.minVariantPrice
    ? moneyToCents(product.compareAtPriceRange.minVariantPrice)
    : null
  const onSale = compareMin != null && compareMin > priceMin

  const eyebrow = product.productType || product.vendor || 'HV Jewelers'

  // Normalized tags as routes back into the catalog — the way off a PDP that
  // isn't the back button.
  const browseLinks = facetLinks(product)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const productUrl = `${siteUrl}/shop/${handle}`

  // Mirrors the published policy on /returns: 15-day mail-back window,
  // customer pays return shipping; earrings are final sale (hygiene).
  const isEarrings = (product.productType || '').trim() === 'Earrings'
  const returnPolicy = isEarrings
    ? {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      }
    : {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory:
          'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 15,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.featuredImage?.url,
    brand: { '@type': 'Brand', name: 'HV Jewelers' },
    sku: product.variants[0]?.sku ?? undefined,
    offers: {
      '@type': 'Offer',
      price: (priceMin / 100).toFixed(2),
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      // Rolling 30-day window; the page revalidates every 10 minutes so
      // the date (and price) never go stale.
      priceValidUntil: new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .slice(0, 10),
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: productUrl,
      // Free insured domestic shipping; most pieces ship within two
      // business days (see /shipping).
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 0,
          currency: product.priceRange.minVariantPrice.currencyCode,
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 2,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: returnPolicy,
    },
  }

  return (
    <>
      <meta property="og:type" content="product" />
      {priceAmount ? (
        <>
          <meta property="product:price:amount" content={priceAmount} />
          <meta property="product:price:currency" content={priceCurrency ?? 'USD'} />
          <meta property="og:price:amount" content={priceAmount} />
          <meta property="og:price:currency" content={priceCurrency ?? 'USD'} />
        </>
      ) : null}
      <meta property="og:availability" content={availability} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Container className="pt-10">
        <Breadcrumbs
          items={[
            { label: 'HV Jewelers', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: product.title },
          ]}
        />
      </Container>

      <Container className="py-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:items-start lg:gap-16">
          <ProductGallery media={media} productTitle={product.title} />

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-eyebrow text-bronze">{eyebrow}</p>
            <h1 className="mt-4 font-serif text-display font-light italic leading-[1.05] text-ink">
              {product.title}
            </h1>

            <div className="mt-6 flex items-baseline gap-3">
              {onSale && compareMin != null ? (
                <>
                  <span className="font-serif text-title text-ink tabular-nums">
                    {formatMoney(product.priceRange.minVariantPrice)}
                  </span>
                  <span className="text-caption text-ink-muted line-through decoration-bronze/50 tabular-nums">
                    {formatMoney({
                      amount: (compareMin / 100).toFixed(2),
                      currencyCode: product.priceRange.minVariantPrice.currencyCode,
                    })}
                  </span>
                </>
              ) : (
                <span className="font-serif text-title text-ink tabular-nums">
                  {formatMoney(product.priceRange.minVariantPrice)}
                </span>
              )}
            </div>

            {/* Availability is stated in words, not just in the JSON-LD above.
                A buyer — and a marketplace reviewer walking the page — should
                not have to read the schema to learn whether a piece is still
                here. Every piece in the catalog is one of one, so the same
                line carries the scarcity. This reads availableForSale rather
                than a count because the Storefront token does not carry
                unauthenticated_read_product_inventory; if HV ever holds two of
                something, restore that scope and gate on the real number. */}
            <p className="mt-4 text-caption text-bronze">
              {product.availableForSale ? 'Only one available.' : 'Sold.'}
            </p>

            {product.description && (
              <p className="mt-6 max-w-prose text-body leading-relaxed text-ink-soft">
                {product.description}
              </p>
            )}

            <div className="mt-10">
              <AddToShopCartForm
                variants={product.variants}
                options={product.options}
              />
            </div>

            {browseLinks.length > 0 && (
              <div className="mt-10 border-t border-limestone-deep/60 pt-6">
                <p className="text-eyebrow text-ink-muted">Browse by</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {browseLinks.map((link) => (
                    <li key={`${link.key}:${link.value}`}>
                      <Link
                        href={link.href}
                        className="inline-block border border-limestone-deep bg-parchment px-3 py-1.5 text-caption text-ink-soft transition-colors duration-300 hover:border-olive hover:text-olive"
                      >
                        {link.value}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 border-t border-limestone-deep/60 pt-6 text-caption text-ink-muted">
              <p>
                Free insured shipping on every order. Signature required on
                delivery for pieces over $5,000.
              </p>
              <Link
                href="/shipping"
                className="mt-3 inline-block text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
              >
                How shipping works →
              </Link>
            </div>

            {/* The return terms are stated on the product itself, not only on
                /returns and in the JSON-LD above. Two audiences need it here:
                a buyer deciding on a final-sale pair of earrings, and the
                automated checks that compare a merchant's declared return
                policy against what the product page actually says. This text
                and `returnPolicy` are driven by the same `isEarrings` flag, so
                the page and the structured data cannot drift apart. */}
            <div className="mt-6 border-t border-limestone-deep/60 pt-6 text-caption text-ink-muted">
              <p>
                {isEarrings
                  ? 'Final sale. For hygiene reasons, earrings are not eligible for return.'
                  : 'Eligible for a 15-day return in original, unused condition. Return shipping is insured, signed for, and paid by you.'}
              </p>
              <Link
                href="/returns"
                className="mt-3 inline-block text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
              >
                How returns work →
              </Link>
            </div>
          </aside>
        </div>
      </Container>

      {product.descriptionHtml && product.description && product.descriptionHtml !== product.description && (
        <section className="border-t border-limestone-deep/60 bg-parchment">
          <Container className="py-20 md:py-24" width="reading">
            <p className="text-eyebrow text-bronze">In the case</p>
            <div
              className="mt-8 space-y-6 font-serif text-body leading-[1.85] text-ink-soft [&_p]:mb-4 [&_strong]:text-ink"
              dangerouslySetInnerHTML={{ __html: sanitizeShopifyHtml(product.descriptionHtml) }}
            />
          </Container>
        </section>
      )}

      <ConciergeClose />
    </>
  )
}
