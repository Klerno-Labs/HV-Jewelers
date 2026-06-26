import 'server-only'
import { serverEnv, clientEnv } from '@/lib/env'

/**
 * Storefront API GraphQL client. Plain fetch lets Next cache responses
 * by tag and keeps the Shopify SDK out of the React payload.
 *
 * Credentials come from env vars, which the owner sets from /admin/shopify
 * (it writes .env + .env.local). If a private (delegate) access token is
 * present it's used for these server-side reads — Shopify's recommended path
 * for headless — otherwise the public access token is used. Both are
 * read-only and scoped to product listings, collections, and cart mutations.
 *
 * Shopify rotates Storefront API versions on a 12-month cadence; set
 * SHOPIFY_STOREFRONT_API_VERSION (or the fallback below) to the latest stable.
 */

const API_VERSION = serverEnv.SHOPIFY_STOREFRONT_API_VERSION ?? '2025-10'

export function shopifyConfigured(): boolean {
  return Boolean(
    (serverEnv.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ||
      serverEnv.SHOPIFY_STOREFRONT_TOKEN) &&
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

/** Prefer the private (server-side) token; fall back to the public one. */
function authHeaders(): Record<string, string> {
  const priv = serverEnv.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
  if (priv) return { 'Shopify-Storefront-Private-Token': priv }
  return {
    'X-Shopify-Storefront-Access-Token': serverEnv.SHOPIFY_STOREFRONT_TOKEN ?? '',
  }
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
      ...authHeaders(),
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
