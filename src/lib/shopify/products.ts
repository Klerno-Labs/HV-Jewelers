import 'server-only'
import { SHOPIFY_TAGS, shopifyConfigured, shopifyFetch } from './client'
import {
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_HANDLES_QUERY,
} from './queries'
import type { ImageEdge, ProductMedia, ShopifyProduct } from './types'

/**
 * Storefront product reads. All flatten the Shopify edge-and-node
 * connection format so the UI never sees `edges[].node`.
 */

interface RawMediaNode {
  mediaContentType: string
  image?: ImageEdge | null
  alt?: string | null
  sources?: Array<{ url: string; mimeType: string; width: number | null; height: number | null }>
  previewImage?: ImageEdge | null
}

type RawProduct = Omit<ShopifyProduct, 'images' | 'variants' | 'media'> & {
  images: { edges: Array<{ node: ShopifyProduct['images'][number] }> }
  variants: { edges: Array<{ node: ShopifyProduct['variants'][number] }> }
  media?: { edges: Array<{ node: RawMediaNode }> }
}

/**
 * Normalize Shopify's media union to our `ProductMedia[]`. Only IMAGE and
 * VIDEO are surfaced today; ExternalVideo/Model3d are dropped (a video with
 * no playable source is skipped rather than rendered empty).
 */
function mapMedia(raw: RawProduct['media']): ProductMedia[] {
  if (!raw) return []
  const out: ProductMedia[] = []
  for (const { node } of raw.edges) {
    if (node.mediaContentType === 'IMAGE' && node.image) {
      out.push({
        mediaType: 'image',
        url: node.image.url,
        altText: node.image.altText,
        width: node.image.width,
        height: node.image.height,
      })
    } else if (
      node.mediaContentType === 'VIDEO' &&
      node.sources &&
      node.sources.length > 0
    ) {
      out.push({
        mediaType: 'video',
        altText: node.alt ?? null,
        sources: node.sources,
        previewImage: node.previewImage ?? null,
      })
    }
  }
  return out
}

function flattenProduct(raw: RawProduct): ShopifyProduct {
  return {
    ...raw,
    // totalInventory is no longer fetched (needs the
    // unauthenticated_read_product_inventory scope, which the Storefront token
    // doesn't carry). Force null so the "only 1 left" / "sold out" badges
    // simply don't render rather than breaking the whole query.
    totalInventory: raw.totalInventory ?? null,
    images: raw.images.edges.map((e) => e.node),
    variants: raw.variants.edges.map((e) => e.node),
    media: mapMedia(raw.media),
  }
}

interface ProductsResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    edges: Array<{ cursor: string; node: RawProduct }>
  }
}

export async function listProducts(
  first = 50,
  after?: string,
): Promise<{ products: ShopifyProduct[]; endCursor: string | null; hasNextPage: boolean }> {
  if (!shopifyConfigured()) {
    return { products: [], endCursor: null, hasNextPage: false }
  }
  try {
    const data = await shopifyFetch<ProductsResponse>(PRODUCTS_QUERY, {
      variables: { first, after: after ?? null },
      tags: [SHOPIFY_TAGS.products],
    })
    return {
      products: data.products.edges.map((e) => flattenProduct(e.node)),
      endCursor: data.products.pageInfo.endCursor,
      hasNextPage: data.products.pageInfo.hasNextPage,
    }
  } catch (err) {
    console.error('[shopify] listProducts failed', err)
    return { products: [], endCursor: null, hasNextPage: false }
  }
}

interface ProductByHandleResponse {
  product: RawProduct | null
}

export async function getProductByHandle(
  handle: string,
): Promise<ShopifyProduct | null> {
  if (!shopifyConfigured()) return null
  try {
    const data = await shopifyFetch<ProductByHandleResponse>(
      PRODUCT_BY_HANDLE_QUERY,
      {
        variables: { handle },
        tags: [SHOPIFY_TAGS.products, SHOPIFY_TAGS.product(handle)],
      },
    )
    return data.product ? flattenProduct(data.product) : null
  } catch (err) {
    console.error('[shopify] getProductByHandle failed', handle, err)
    return null
  }
}

interface ProductHandlesResponse {
  products: { edges: Array<{ node: { handle: string; updatedAt: string } }> }
}

export async function listProductHandles(
  first = 250,
): Promise<Array<{ handle: string; updatedAt: string }>> {
  if (!shopifyConfigured()) return []
  try {
    const data = await shopifyFetch<ProductHandlesResponse>(PRODUCT_HANDLES_QUERY, {
      variables: { first },
      tags: [SHOPIFY_TAGS.products],
    })
    return data.products.edges.map((e) => e.node)
  } catch (err) {
    console.error('[shopify] listProductHandles failed', err)
    return []
  }
}
