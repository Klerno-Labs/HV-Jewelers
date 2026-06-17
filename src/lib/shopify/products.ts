import 'server-only'
import { SHOPIFY_TAGS, shopifyConfigured, shopifyFetch } from './client'
import {
  PRODUCTS_QUERY,
  PRODUCTS_BY_QUERY_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_HANDLES_QUERY,
} from './queries'
import type { ShopifyProduct } from './types'

/**
 * Storefront product reads. All flatten the Shopify edge-and-node
 * connection format so the UI never sees `edges[].node`.
 */

type RawProduct = Omit<
  ShopifyProduct,
  'images' | 'variants' | 'totalInventory'
> & {
  images: { edges: Array<{ node: ShopifyProduct['images'][number] }> }
  variants: { edges: Array<{ node: ShopifyProduct['variants'][number] }> }
}

function flattenProduct(raw: RawProduct): ShopifyProduct {
  return {
    ...raw,
    // Not queried — the current Storefront token lacks the inventory
    // read scope (see PRODUCT_FRAGMENT). UI falls back to
    // availableForSale.
    totalInventory: null,
    images: raw.images.edges.map((e) => e.node),
    variants: raw.variants.edges.map((e) => e.node),
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

interface ProductsByQueryResponse {
  products: { edges: Array<{ node: RawProduct }> }
}

/**
 * Products matching a Storefront search query, newest first.
 * `listProductsByTag('gold', 4)` → `query: "tag:gold"`.
 * Returns [] when unconfigured, on error, or when no product carries
 * the tag — callers treat [] as "fall back or hide the section".
 */
export async function listProductsByTag(
  tag: string,
  first = 8,
): Promise<ShopifyProduct[]> {
  if (!shopifyConfigured()) return []
  try {
    const data = await shopifyFetch<ProductsByQueryResponse>(
      PRODUCTS_BY_QUERY_QUERY,
      {
        variables: { first, query: `tag:${tag}` },
        tags: [SHOPIFY_TAGS.products],
      },
    )
    return data.products.edges.map((e) => flattenProduct(e.node))
  } catch (err) {
    console.error('[shopify] listProductsByTag failed', tag, err)
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
