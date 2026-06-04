import 'server-only'
import { serverEnv, clientEnv } from '@/lib/env'

/**
 * Storefront API GraphQL client. Plain fetch lets Next cache responses
 * by tag and keeps the Shopify SDK out of the React payload.
 *
 * Public access token is sent in the X-Shopify-Storefront-Access-Token
 * header. The token is read-only and scoped to product listings,
 * collections, and cart mutations — safe to ship in env, but we still
 * keep the read server-side for cleanliness.
 *
 * Shopify rotates Storefront API versions on a 12-month cadence; bump
 * SHOPIFY_STOREFRONT_API_VERSION (or the fallback below) to the latest
 * stable when the current one nears EOL.
 */

const API_VERSION = serverEnv.SHOPIFY_STOREFRONT_API_VERSION ?? '2025-10'

export function shopifyConfigured(): boolean {
  return Boolean(
    serverEnv.SHOPIFY_STOREFRONT_TOKEN &&
      clientEnv.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  )
}

function endpoint(): string {
  const domain = clientEnv.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  if (!domain) {
    throw new Error('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set')
  }
  // Shopify shows the domain as `store.myshopify.com`, but env files often carry
  // a full `https://…/` — normalize so we never build `https://https://…//api`.
  const host = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return `https://${host}/api/${API_VERSION}/graphql.json`
}

interface QueryOptions {
  variables?: Record<string, unknown>
  /// Tags used by `revalidateTag()` after mutations.
  tags?: string[]
  /// Default to time-revalidated caching reads; mutations pass 'no-store'.
  cache?: RequestCache
  /// Revalidation window in seconds for tagged reads. Ignored when
  /// cache is 'no-store'.
  revalidate?: number
}

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string; locations?: unknown; path?: string[] }>
}

export async function shopifyFetch<T>(
  query: string,
  options: QueryOptions = {},
): Promise<T> {
  if (!shopifyConfigured()) {
    throw new Error('Shopify Storefront API is not configured.')
  }

  const cache = options.cache ?? 'force-cache'
  const next =
    cache === 'no-store'
      ? undefined
      : {
          revalidate: options.revalidate ?? 600,
          tags: options.tags ?? [],
        }

  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': serverEnv.SHOPIFY_STOREFRONT_TOKEN!,
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables: options.variables ?? {} }),
    cache,
    next,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `Shopify Storefront API ${res.status}: ${body.slice(0, 200)}`,
    )
  }

  const json = (await res.json()) as GraphQLResponse<T>
  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join('; ')
    throw new Error(`Shopify GraphQL error: ${messages}`)
  }
  if (!json.data) {
    throw new Error('Shopify GraphQL returned no data.')
  }
  return json.data
}

export const SHOPIFY_TAGS = {
  products: 'shopify:products',
  product: (handle: string) => `shopify:product:${handle}`,
  cart: (cartId: string) => `shopify:cart:${cartId}`,
} as const
