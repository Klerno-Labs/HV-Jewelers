import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { ProductGallery, type GalleryMedia } from '@/components/store/product-gallery'
import { ProductAssistance } from '@/components/store/product-assistance'
import { ConciergeClose } from '@/components/store/concierge-close'
import { AddToShopCartForm } from '@/components/shop/add-to-shop-cart-form'
import { getProductByHandle, listProductHandles } from '@/lib/shopify/products'
import { formatMoney, moneyToCents } from '@/lib/shopify/money'
import { sanitizeShopifyHtml } from '@/lib/shopify/html'
import { getImageBgColors } from '@/lib/image-bg'
import { facetLinks } from '@/lib/shopify/facets'
import { BUSINESS } from '@/lib/business'

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hvjewelers.com'
).replace(/\/$/, '')

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) return { title: 'Not found' }

  const description =
    product.description?.slice(0, 160) ??
    `One-of-a-kind ${product.productType.toLowerCase()} from the HV Jewelers Houston showroom.`
  const canonical = `${SITE_URL}/shop/${handle}`

  return {
    title: product.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${product.title} | HV Jewelers`,
      description: product.description?.slice(0, 200) ?? description,
      images: product.featuredImage?.url
        ? [
            {
              url: product.featuredImage.url,
              alt: product.featuredImage.altText?.trim() || product.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | HV Jewelers`,
      description,
      images: product.featuredImage?.url ? [product.featuredImage.url] : undefined,
    },
  }
}

export async function generateStaticParams() {
  const handles = await listProductHandles(100)
  return handles.map((product) => ({ handle: product.handle }))
}

export const revalidate = 600

export default async function ShopProductPage({ params }: PageProps) {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) notFound()

  const priceAmount = product.priceRange.minVariantPrice?.amount
  const priceCurrency = product.priceRange.minVariantPrice?.currencyCode
  const availability = product.availableForSale ? 'instock' : 'out of stock'

  const galleryMedia: GalleryMedia[] =
    product.media.length > 0
      ? product.media.map((mediaItem, index) => {
          const fallbackAlt = `${product.title} — ${
            mediaItem.mediaType === 'video' ? 'video' : `view ${index + 1}`
          }`
          if (mediaItem.mediaType === 'video') {
            const best =
              mediaItem.sources.find((source) => source.mimeType === 'video/mp4') ??
              mediaItem.sources[0]
            return {
              kind: 'video' as const,
              src: best?.url ?? '',
              mimeType: best?.mimeType ?? 'video/mp4',
              poster: mediaItem.previewImage?.url ?? null,
              alt: mediaItem.altText?.trim() || fallbackAlt,
              width: best?.width ?? mediaItem.previewImage?.width ?? null,
              height: best?.height ?? mediaItem.previewImage?.height ?? null,
            }
          }
          return {
            kind: 'image' as const,
            url: mediaItem.url,
            alt: mediaItem.altText?.trim() || fallbackAlt,
            width: mediaItem.width,
            height: mediaItem.height,
          }
        })
      : (product.images.length > 0
          ? product.images
          : product.featuredImage
            ? [product.featuredImage]
            : []
        ).map((image, index) => ({
          kind: 'image' as const,
          url: image.url,
          alt: image.altText?.trim() || `${product.title} — view ${index + 1}`,
          width: image.width,
          height: image.height,
        }))

  const imageBgs = await getImageBgColors(
    galleryMedia.flatMap((mediaItem) =>
      mediaItem.kind === 'image' ? [mediaItem.url] : [],
    ),
  )
  const media: GalleryMedia[] = galleryMedia.map((mediaItem) =>
    mediaItem.kind === 'image'
      ? { ...mediaItem, bg: imageBgs[mediaItem.url] ?? null }
      : mediaItem,
  )

  const priceMin = moneyToCents(product.priceRange.minVariantPrice)
  const compareMin = product.compareAtPriceRange?.minVariantPrice
    ? moneyToCents(product.compareAtPriceRange.minVariantPrice)
    : null
  const onSale = compareMin != null && compareMin > priceMin
  const eyebrow = product.productType || product.vendor || 'HV Jewelers'
  const browseLinks = facetLinks(product)
  const productUrl = `${SITE_URL}/shop/${handle}`
  const sku = product.variants[0]?.sku ?? null

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
    '@id': `${productUrl}#product`,
    name: product.title,
    description: product.description,
    url: productUrl,
    image: product.images.map((image) => image.url),
    category: product.productType,
    brand: { '@type': 'Brand', name: BUSINESS.name },
    sku: sku ?? undefined,
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      price: (priceMin / 100).toFixed(2),
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      priceValidUntil: new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .slice(0, 10),
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: BUSINESS.name,
        url: SITE_URL,
        telephone: BUSINESS.telephone,
      },
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'HV Jewelers',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${SITE_URL}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: productUrl,
      },
    ],
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productSchema, breadcrumbSchema]),
        }}
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

            <p className="mt-4 text-caption text-bronze">
              {product.availableForSale ? 'Only one available.' : 'Sold.'}
            </p>

            {product.description && (
              <p className="mt-6 max-w-prose text-body leading-relaxed text-ink-soft">
                {product.description}
              </p>
            )}

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-limestone-deep/60 py-5 text-caption">
              <div>
                <dt className="text-ink-muted">Category</dt>
                <dd className="mt-1 text-ink">{product.productType || 'Fine jewelry'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Condition</dt>
                <dd className="mt-1 text-ink">New</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Item reference</dt>
                <dd className="mt-1 break-all text-ink">{sku ?? 'Available on request'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Held at</dt>
                <dd className="mt-1 text-ink">Houston showroom</dd>
              </div>
            </dl>

            <div className="mt-8">
              <AddToShopCartForm
                variants={product.variants}
                options={product.options}
              />
            </div>

            <ProductAssistance productTitle={product.title} productUrl={productUrl} />

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

      {product.descriptionHtml &&
        product.description &&
        product.descriptionHtml !== product.description && (
          <section className="border-t border-limestone-deep/60 bg-parchment">
            <Container className="py-20 md:py-24" width="reading">
              <p className="text-eyebrow text-bronze">In the case</p>
              <div
                className="mt-8 space-y-6 font-serif text-body leading-[1.85] text-ink-soft [&_p]:mb-4 [&_strong]:text-ink"
                dangerouslySetInnerHTML={{
                  __html: sanitizeShopifyHtml(product.descriptionHtml),
                }}
              />
            </Container>
          </section>
        )}

      <ConciergeClose />
    </>
  )
}
