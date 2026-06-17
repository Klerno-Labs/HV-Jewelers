import { Suspense } from 'react'
import { cache } from 'react'
import Image from 'next/image'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { HoverTilt } from '@/components/immersive/hover-tilt'
import { ConciergeClose } from '@/components/store/concierge-close'
import { ShopProductCard } from '@/components/shop/shop-product-card'
import { Hero3D } from '@/components/immersive/sections/hero-3d'
import { ManifestoReveal } from '@/components/immersive/manifesto-reveal'
import {
  FINE_PANEL,
  GOLD_PANEL,
  StoryPanel,
} from '@/components/immersive/sections/story-panels'
import { ProductShowcase } from '@/components/immersive/sections/product-showcase'
import { ConversionRunway } from '@/components/immersive/sections/conversion-runway'
import {
  ProductRowSkeleton,
  ShowcaseSkeleton,
} from '@/components/immersive/sections/skeletons'
import { listProducts, listProductsByTag } from '@/lib/shopify/products'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * The immersive home. Scroll journey:
 *   Hero3D (scroll-driven scene) → ManifestoReveal → Gold panel +
 *   row → Fine Jewelry panel + row → Newly added showcase →
 *   ConversionRunway → ConciergeClose.
 *
 * Data: three tag-filtered queries (gold / fine-jewelry /
 * new-arrival). When no products carry those tags yet, falls back to
 * the latest catalog sliced across the sections, so the page is
 * always populated. Product sections stream behind Suspense with
 * geometry-matched skeletons; on error or empty catalog they hide and
 * the page stays a coherent typographic composition.
 */

interface HomeProducts {
  gold: ShopifyProduct[]
  fine: ShopifyProduct[]
  arrivals: ShopifyProduct[]
}

const getHomeProducts = cache(async (): Promise<HomeProducts> => {
  const [gold, fine, arrivals] = await Promise.all([
    listProductsByTag('gold', 4),
    listProductsByTag('fine-jewelry', 4),
    listProductsByTag('new-arrival', 4),
  ])
  if (gold.length > 0 || fine.length > 0 || arrivals.length > 0) {
    return { gold, fine, arrivals }
  }
  // No curation tags in Shopify yet — slice the latest catalog.
  const { products } = await listProducts(12)
  return {
    gold: products.slice(0, 4),
    fine: products.slice(4, 8),
    arrivals: products.slice(8, 12),
  }
})

export default function Home() {
  return (
    <>
      <Hero3D />

      <ManifestoReveal />

      <StoryPanel
        panel={GOLD_PANEL}
        plateChildren={
          <Suspense fallback={null}>
            <PlateImage pick="gold" />
          </Suspense>
        }
      />
      <Suspense fallback={<ProductRowSkeleton />}>
        <LiveProductRow pick="gold" />
      </Suspense>

      <StoryPanel
        panel={FINE_PANEL}
        plateChildren={
          <Suspense fallback={null}>
            <PlateImage pick="fine" />
          </Suspense>
        }
      />
      <Suspense fallback={<ProductRowSkeleton />}>
        <LiveProductRow pick="fine" />
      </Suspense>

      <Suspense fallback={<ShowcaseSkeleton />}>
        <LiveShowcase />
      </Suspense>

      <ConversionRunway />

      <ConciergeClose />
    </>
  )
}

/** Staggered per-card entrance delays (cycles across the row). */
const CARD_DELAYS = [0, 100, 150, 200] as const

async function LiveProductRow({ pick }: { pick: 'gold' | 'fine' }) {
  const products = (await getHomeProducts())[pick]
  if (products.length === 0) return null

  return (
    <section className="border-t border-limestone-deep/60">
      <Container className="py-16 md:py-20">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {products.map((product, i) => (
            <li key={product.id}>
              <FadeIn delay={CARD_DELAYS[i % CARD_DELAYS.length] ?? 0}>
                <HoverTilt>
                  <ShopProductCard product={product} />
                </HoverTilt>
              </FadeIn>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

async function LiveShowcase() {
  const { arrivals } = await getHomeProducts()
  return <ProductShowcase products={arrivals} />
}

/**
 * Real product photography inside a story panel's parallax plate.
 * Multiply blend drops the white studio ground into the plate's
 * gradient; contained with generous padding so it reads as set
 * dressing, not a floating cut-out.
 */
async function PlateImage({ pick }: { pick: 'gold' | 'fine' }) {
  const image = (await getHomeProducts())[pick][0]?.featuredImage
  if (!image) return null

  return (
    <Image
      src={image.url}
      alt={image.altText ?? ''}
      fill
      sizes="(min-width: 1024px) 45vw, 90vw"
      className="object-contain p-[14%] mix-blend-multiply"
    />
  )
}
