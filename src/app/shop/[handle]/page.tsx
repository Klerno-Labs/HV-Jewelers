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

  const priceMin = moneyToCents(product.priceRange.minVariantPrice)
  const compareMin = product.compareAtPriceRange?.minVariantPrice
    ? moneyToCents(product.compareAtPriceRange.minVariantPrice)
    : null
  const onSale = compareMin != null && compareMin > priceMin

  const eyebrow = product.productType || product.vendor || 'HV Jewelers'

  return (
    <>
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
          <ProductGallery media={galleryMedia} productTitle={product.title} />

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

            {product.tags.length > 0 && (
              <div className="mt-10 border-t border-limestone-deep/60 pt-6">
                <p className="text-eyebrow text-ink-muted">Tagged</p>
                <p className="mt-3 text-caption text-ink-soft">
                  {product.tags.join(' · ')}
                </p>
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
