import 'server-only'
import { SHOPIFY_TAGS, shopifyConfigured, shopifyFetch } from './client'
import {
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_HANDLES_QUERY,
} from './queries'
import type { ImageEdge, ProductMedia, ShopifyProduct } from './types'

/**
 * Storefront product reads. All flatten the Shopify edge-and-node connection
 * format so the UI never sees `edges[].node`.
 */

interface RawMediaNode {
  mediaContentType: string
  image?: ImageEdge | null
  alt?: string | null
  sources?: Array<{
    url: string
    mimeType: string
    width: number | null
    height: number | null
  }>
  previewImage?: ImageEdge | null
}

type RawProduct = Omit<ShopifyProduct, 'images' | 'variants' | 'media'> & {
  images: { edges: Array<{ node: ShopifyProduct['images'][number] }> }
  variants: { edges: Array<{ node: ShopifyProduct['variants'][number] }> }
  media?: { edges: Array<{ node: RawMediaNode }> }
}

function mapMedia(raw: RawProduct['media']): ProductMedia[] {
  if (!raw) return []
  const output: ProductMedia[] = []
  for (const { node } of raw.edges) {
    if (node.mediaContentType === 'IMAGE' && node.image) {
      output.push({
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
      output.push({
        mediaType: 'video',
        altText: node.alt ?? null,
        sources: node.sources,
        previewImage: node.previewImage ?? null,
      })
    }
  }
  return output
}

function flattenProduct(raw: RawProduct): ShopifyProduct {
  return {
    ...raw,
    totalInventory: raw.totalInventory ?? null,
    images: raw.images.edges.map((edge) => edge.node),
    variants: raw.variants.edges.map((edge) => edge.node),
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
): Promise<{
  products: ShopifyProduct[]
  endCursor: string | null
  hasNextPage: boolean
}> {
  if (!shopifyConfigured()) {
    return { products: [], endCursor: null, hasNextPage: false }
  }
  try {
    const data = await shopifyFetch<ProductsResponse>(PRODUCTS_QUERY, {
      variables: { first, after: after ?? null },
      tags: [SHOPIFY_TAGS.products],
    })
    return {
      products: data.products.edges.map((edge) => flattenProduct(edge.node)),
      endCursor: data.products.pageInfo.endCursor,
      hasNextPage: data.products.pageInfo.hasNextPage,
    }
  } catch (error) {
    console.error('[shopify] listProducts failed', error)
    return { products: [], endCursor: null, hasNextPage: false }
  }
}

/**
 * Strict complete-catalog read for feeds and other jobs where a partial or
 * empty result could incorrectly withdraw products from a third party.
 */
export async function listAllProducts(
  pageSize = 100,
): Promise<ShopifyProduct[]> {
  if (!shopifyConfigured()) {
    throw new Error('Shopify Storefront API is not configured.')
  }

  const all: ShopifyProduct[] = []
  let after: string | null = null

  for (let page = 0; page < 50; page += 1) {
    const data: ProductsResponse = await shopifyFetch<ProductsResponse>(
      PRODUCTS_QUERY,
      {
        variables: { first: pageSize, after },
        tags: [SHOPIFY_TAGS.products],
      },
    )
    all.push(...data.products.edges.map((edge) => flattenProduct(edge.node)))

    if (!data.products.pageInfo.hasNextPage) return all
    after = data.products.pageInfo.endCursor
    if (!after) return all
  }

  return all
}

/**
 * Fail-soft complete-catalog read for human-facing and indexable pages.
 * Permanent collection routes should still build and return useful content
 * when credentials are absent in CI or Shopify is temporarily unavailable.
 * Merchant and Pinterest feeds deliberately continue using strict
 * `listAllProducts()` so they can return 5xx and preserve the last good feed.
 */
export async function listAllProductsForPages(
  pageSize = 100,
): Promise<ShopifyProduct[]> {
  try {
    return await listAllProducts(pageSize)
  } catch (error) {
    console.error('[shopify] page catalog fetch failed', error)
    return []
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
  } catch (error) {
    console.error('[shopify] getProductByHandle failed', handle, error)
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
    return data.products.edges.map((edge) => edge.node)
  } catch (error) {
    console.error('[shopify] listProductHandles failed', error)
    return []
  }
}
