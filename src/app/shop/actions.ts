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
 */

export interface CartActionResult {
  cart: ShopifyCart | null
  userErrors: UserError[]
  ok: boolean
}

const RATE_LIMIT_ERROR: CartActionResult = {
  cart: null,
  userErrors: [
    {
      field: null,
      message: 'Too many requests. Try again in a moment.',
      code: 'RATE_LIMITED',
    },
  ],
  ok: false,
}

async function clientKey(): Promise<string> {
  const h = await headers()
  return getClientKey(h)
}

function invalidVariantResult(): CartActionResult {
  return {
    cart: null,
    userErrors: [
      { field: ['merchandiseId'], message: 'Missing variant.', code: null },
    ],
    ok: false,
  }
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
  if (!merchandiseId || quantity < 1) return invalidVariantResult()

  const key = await clientKey()
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

/**
 * Move a selected product directly into Shopify checkout. If that exact
 * variant is already in the visitor's bag, reuse the existing cart rather
 * than adding a duplicate one-of-one item.
 */
export async function buyNowAction(
  merchandiseId: string,
): Promise<CartActionResult> {
  if (!merchandiseId) return invalidVariantResult()

  const key = await clientKey()
  const existingCartId = await readCartIdCookie()
  const limiter = existingCartId ? apiLimiter : cartCreateLimiter
  const { success } = await limiter.limit(key)
  if (!success) return RATE_LIMIT_ERROR

  let cart = existingCartId ? await getCart() : null
  const alreadyInCart = cart?.lines.some(
    (line) => line.merchandise.id === merchandiseId,
  )

  if (!alreadyInCart) {
    const result = await addLineToCart(merchandiseId, 1)
    if (result.userErrors.length > 0 || !result.cart) {
      return {
        cart: result.cart,
        userErrors: result.userErrors,
        ok: false,
      }
    }
    cart = result.cart
  }

  if (!cart) {
    return {
      cart: null,
      userErrors: [
        {
          field: null,
          message: 'Could not prepare checkout. Try adding the piece to your bag.',
          code: 'CHECKOUT_UNAVAILABLE',
        },
      ],
      ok: false,
    }
  }

  await clearCartIdCookie()
  redirect(cart.checkoutUrl)
}

export async function updateCartLineAction(
  lineId: string,
  quantity: number,
): Promise<CartActionResult> {
  if (!lineId || quantity < 0) {
    return {
      cart: null,
      userErrors: [
        { field: ['lineId'], message: 'Missing line.', code: null },
      ],
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
      userErrors: [
        { field: ['lineId'], message: 'Missing line.', code: null },
      ],
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
  await clearCartIdCookie()
  redirect(cart.checkoutUrl)
}
