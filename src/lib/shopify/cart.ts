import 'server-only'
import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'
import { SHOPIFY_TAGS, shopifyConfigured, shopifyFetch } from './client'
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from './queries'
import { isProd } from '@/lib/env'
import type {
  CartLine,
  CartMutationResult,
  ShopifyCart,
} from './types'

/**
 * Server-only Shopify cart helpers. Cart ID lives in an httpOnly cookie
 * (`hv.shop.cart` in dev, `__Secure-hv.shop.cart` in prod).
 *
 * The cart fetch is tagged with `SHOPIFY_TAGS.cart(cartId)` and uses a
 * 30s revalidate window, so back-to-back page navigations do not each
 * pay a Storefront API round-trip; every mutation calls
 * `revalidateTag(SHOPIFY_TAGS.cart(cartId))` so the header reflects
 * changes immediately.
 */

const COOKIE_NAME = isProd ? '__Secure-hv.shop.cart' : 'hv.shop.cart'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function readCartIdCookie(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE_NAME)?.value ?? null
}

export async function writeCartIdCookie(cartId: string): Promise<void> {
  const jar = await cookies()
  jar.set({
    name: COOKIE_NAME,
    value: cartId,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

/**
 * Clear the cart cookie. **Only callable from a Server Action, Route
 * Handler, or middleware** — Next 15 forbids `cookies().set()` from
 * Server Component render paths.
 */
export async function clearCartIdCookie(): Promise<void> {
  const jar = await cookies()
  jar.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ─── Cart shape adapter ────────────────────────────────────────────────

interface RawLine {
  id: string
  quantity: number
  cost: CartLine['cost']
  merchandise: {
    id: string
    title: string
    sku: string | null
    image: CartLine['merchandise']['image']
    product: { handle: string; title: string }
    selectedOptions: CartLine['merchandise']['selectedOptions']
  }
}

interface RawCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  createdAt: string
  updatedAt: string
  cost: ShopifyCart['cost']
  lines: { edges: Array<{ node: RawLine }> }
}

function flattenCart(raw: RawCart): ShopifyCart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    cost: raw.cost,
    lines: raw.lines.edges.map((e) => e.node),
  }
}

// ─── Reads ────────────────────────────────────────────────────────────

interface CartQueryResponse { cart: RawCart | null }

/**
 * Read the cart for the current visitor.
 *
 * Safe to call from a Server Component render path: when Shopify
 * reports the cart no longer exists, we do **not** mutate the cookie
 * here (that would throw in RSC). The stale cookie is reaped on the
 * next cart mutation by `addLineToCart`, which runs in a Server Action
 * context where cookie writes are legal.
 */
export async function getCart(): Promise<ShopifyCart | null> {
  if (!shopifyConfigured()) return null
  const cartId = await readCartIdCookie()
  if (!cartId) return null
  try {
    const data = await shopifyFetch<CartQueryResponse>(CART_QUERY, {
      variables: { cartId },
      revalidate: 30,
      tags: [SHOPIFY_TAGS.cart(cartId)],
    })
    if (!data.cart) return null
    return flattenCart(data.cart)
  } catch (err) {
    console.error('[shopify] getCart failed', err)
    return null
  }
}

export async function getCartQuantity(): Promise<number> {
  const cart = await getCart()
  return cart?.totalQuantity ?? 0
}

// ─── Mutations ────────────────────────────────────────────────────────

interface CartCreateResponse {
  cartCreate: { cart: RawCart | null; userErrors: CartMutationResult['userErrors'] }
}

interface CartLinesAddResponse {
  cartLinesAdd: { cart: RawCart | null; userErrors: CartMutationResult['userErrors'] }
}

interface CartLinesUpdateResponse {
  cartLinesUpdate: { cart: RawCart | null; userErrors: CartMutationResult['userErrors'] }
}

interface CartLinesRemoveResponse {
  cartLinesRemove: { cart: RawCart | null; userErrors: CartMutationResult['userErrors'] }
}

export async function addLineToCart(
  merchandiseId: string,
  quantity = 1,
): Promise<CartMutationResult> {
  if (!shopifyConfigured()) {
    return { cart: null, userErrors: [{ field: null, message: 'Shopify is not configured.', code: null }] }
  }

  const existingCartId = await readCartIdCookie()

  if (!existingCartId) {
    const data = await shopifyFetch<CartCreateResponse>(CART_CREATE_MUTATION, {
      variables: { input: { lines: [{ merchandiseId, quantity }] } },
      cache: 'no-store',
    })
    const cart = data.cartCreate.cart
    if (cart) {
      await writeCartIdCookie(cart.id)
      revalidateTag(SHOPIFY_TAGS.cart(cart.id))
    }
    return {
      cart: cart ? flattenCart(cart) : null,
      userErrors: data.cartCreate.userErrors,
    }
  }

  const data = await shopifyFetch<CartLinesAddResponse>(CART_LINES_ADD_MUTATION, {
    variables: {
      cartId: existingCartId,
      lines: [{ merchandiseId, quantity }],
    },
    cache: 'no-store',
  })
  const cart = data.cartLinesAdd.cart

  // Shopify returns `cart: null` with empty userErrors when the saved
  // cart has been deleted (carts expire after ~10 days of inactivity,
  // or after the customer completes checkout). Clear the stale cookie
  // and recreate the cart in one retry.
  if (!cart && data.cartLinesAdd.userErrors.length === 0) {
    await clearCartIdCookie()
    return addLineToCart(merchandiseId, quantity)
  }

  if (cart) revalidateTag(SHOPIFY_TAGS.cart(cart.id))

  return {
    cart: cart ? flattenCart(cart) : null,
    userErrors: data.cartLinesAdd.userErrors,
  }
}

export async function updateCartLineQuantity(
  lineId: string,
  quantity: number,
): Promise<CartMutationResult> {
  if (!shopifyConfigured()) {
    return { cart: null, userErrors: [{ field: null, message: 'Shopify is not configured.', code: null }] }
  }
  const cartId = await readCartIdCookie()
  if (!cartId) return { cart: null, userErrors: [] }

  const data = await shopifyFetch<CartLinesUpdateResponse>(
    CART_LINES_UPDATE_MUTATION,
    {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      cache: 'no-store',
    },
  )
  const cart = data.cartLinesUpdate.cart
  if (cart) revalidateTag(SHOPIFY_TAGS.cart(cart.id))
  return {
    cart: cart ? flattenCart(cart) : null,
    userErrors: data.cartLinesUpdate.userErrors,
  }
}

export async function removeCartLine(lineId: string): Promise<CartMutationResult> {
  if (!shopifyConfigured()) {
    return { cart: null, userErrors: [{ field: null, message: 'Shopify is not configured.', code: null }] }
  }
  const cartId = await readCartIdCookie()
  if (!cartId) return { cart: null, userErrors: [] }

  const data = await shopifyFetch<CartLinesRemoveResponse>(
    CART_LINES_REMOVE_MUTATION,
    {
      variables: { cartId, lineIds: [lineId] },
      cache: 'no-store',
    },
  )
  const cart = data.cartLinesRemove.cart
  if (cart) revalidateTag(SHOPIFY_TAGS.cart(cart.id))
  return {
    cart: cart ? flattenCart(cart) : null,
    userErrors: data.cartLinesRemove.userErrors,
  }
}

export { SHOPIFY_TAGS } from './client'
