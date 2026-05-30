'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  addLineToCart,
  clearCartIdCookie,
  getCart,
  readCartIdCookie,
  removeCartLine,
  updateCartLineQuantity,
} from '@/lib/shopify/cart'
import { apiLimiter, cartCreateLimiter, getClientKey } from '@/lib/rate-limit'
import type { ShopifyCart, UserError } from '@/lib/shopify/types'

/**
 * Server actions for the Shopify cart. Each returns the fresh cart so
 * the client drawer can update its local state without a round-trip.
 *
 * Cache invalidation is handled inside the cart helpers via
 * `revalidateTag(SHOPIFY_TAGS.cart(cartId))` so SiteHeader picks up
 * fresh totals on the next render.
 *
 * Rate limits (per IP):
 *  - addToCartAction when no cart exists yet: 10/min (cartCreate is
 *    the most expensive Storefront path — mints a Shopify cart)
 *  - other cart actions: 30/min (apiLimiter)
 */

export interface CartActionResult {
  cart: ShopifyCart | null
  userErrors: UserError[]
  ok: boolean
}

const RATE_LIMIT_ERROR: CartActionResult = {
  cart: null,
  userErrors: [
    { field: null, message: 'Too many requests. Try again in a moment.', code: 'RATE_LIMITED' },
  ],
  ok: false,
}

async function clientKey(): Promise<string> {
  const h = await headers()
  return getClientKey(h)
}

export async function fetchCartAction(): Promise<CartActionResult> {
  const { success } = await apiLimiter.limit(await clientKey())
  if (!success) return RATE_LIMIT_ERROR
  const cart = await getCart()
  return { cart, userErrors: [], ok: true }
}

export async function addToCartAction(
  merchandiseId: string,
  quantity = 1,
): Promise<CartActionResult> {
  if (!merchandiseId || quantity < 1) {
    return {
      cart: null,
      userErrors: [{ field: ['merchandiseId'], message: 'Missing variant.', code: null }],
      ok: false,
    }
  }
  const key = await clientKey()
  // The no-cookie branch will mint a new Shopify cart — gate that
  // path on the tighter cart-create limiter; the cookie-present
  // branch is just a line add, so the general api limiter is enough.
  const existingCartId = await readCartIdCookie()
  const limiter = existingCartId ? apiLimiter : cartCreateLimiter
  const { success } = await limiter.limit(key)
  if (!success) return RATE_LIMIT_ERROR

  const result = await addLineToCart(merchandiseId, quantity)
  return {
    cart: result.cart,
    userErrors: result.userErrors,
    ok: result.userErrors.length === 0 && result.cart !== null,
  }
}

export async function updateCartLineAction(
  lineId: string,
  quantity: number,
): Promise<CartActionResult> {
  if (!lineId || quantity < 0) {
    return {
      cart: null,
      userErrors: [{ field: ['lineId'], message: 'Missing line.', code: null }],
      ok: false,
    }
  }
  const { success } = await apiLimiter.limit(await clientKey())
  if (!success) return RATE_LIMIT_ERROR

  const result =
    quantity === 0
      ? await removeCartLine(lineId)
      : await updateCartLineQuantity(lineId, quantity)
  return {
    cart: result.cart,
    userErrors: result.userErrors,
    ok: result.userErrors.length === 0 && result.cart !== null,
  }
}

export async function removeCartLineAction(
  lineId: string,
): Promise<CartActionResult> {
  if (!lineId) {
    return {
      cart: null,
      userErrors: [{ field: ['lineId'], message: 'Missing line.', code: null }],
      ok: false,
    }
  }
  const { success } = await apiLimiter.limit(await clientKey())
  if (!success) return RATE_LIMIT_ERROR

  const result = await removeCartLine(lineId)
  return {
    cart: result.cart,
    userErrors: result.userErrors,
    ok: result.userErrors.length === 0 && result.cart !== null,
  }
}

export async function startShopifyCheckoutAction(): Promise<void> {
  const cart = await getCart()
  if (!cart) {
    redirect('/shop?error=empty')
  }
  // Clear the cart cookie now — Shopify finalizes the cart on its
  // hosted checkout and our saved id becomes invalid. Doing it here
  // (in a Server Action context) is the only place cookie mutation is
  // legal, so subsequent page renders don't waste a Storefront query.
  await clearCartIdCookie()
  redirect(cart.checkoutUrl)
}
