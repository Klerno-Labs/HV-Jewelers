'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  generateCartToken,
  getCartToken,
  setCartCookie,
} from './cart'
import {
  releaseReservation,
  reserveOneForCart,
} from '@/lib/products/inventory'
import { apiLimiter, getClientKey } from '@/lib/rate-limit'

/**
 * Cart server actions.
 *
 * Design principles:
 *   • Inputs are validated by Zod before any DB call.
 *   • Cart cookie is created lazily on first add — anonymous browsing
 *     never sets a cookie.
 *   • Inventory state is the source of truth: every write goes through
 *     the helpers in `src/lib/products/inventory.ts`, which guarantee
 *     race-safety via conditional UPDATEs and an inventory ledger.
 *   • A failed add never partially writes — we either succeed or surface
 *     the failure mode in the redirect query string.
 *   • Rate-limited per (client + user) so a single client cannot drown
 *     the inventory tables with rapid add attempts.
 */

const addInput = z.object({
  productId: z.string().min(1).max(64),
  productSlug: z
    .string()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

const removeInput = z.object({
  cartItemId: z.string().min(1).max(64),
})

const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000

async function getOrCreateCart(userId: string | null) {
  const token = await getCartToken()
  const now = new Date()

  if (token) {
    const existing = await prisma.cart.findUnique({
      where: { token },
      select: { id: true, status: true, expiresAt: true, userId: true },
    })
    if (existing && existing.status === 'OPEN' && existing.expiresAt > now) {
      // If the cart is anonymous and the user is signed in, attach.
      if (userId && !existing.userId) {
        await prisma.cart.update({
          where: { id: existing.id },
          data: { userId },
        })
      }
      return { id: existing.id, isNew: false }
    }
  }

  const newToken = generateCartToken()
  const created = await prisma.cart.create({
    data: {
      token: newToken,
      userId,
      status: 'OPEN',
      expiresAt: new Date(now.getTime() + CART_TTL_MS),
    },
    select: { id: true },
  })
  await setCartCookie(newToken)
  return { id: created.id, isNew: true }
}

export async function addToBag(formData: FormData) {
  const parsed = addInput.safeParse({
    productId: formData.get('productId'),
    productSlug: formData.get('productSlug'),
  })
  if (!parsed.success) {
    redirect('/bag?error=invalid')
  }
  const { productId, productSlug } = parsed.data

  const session = await auth()
  const userId = session?.user?.id ?? null

  // Rate limit add operations to prevent a runaway client from churning
  // the inventory tables.
  const requestHeaders = await headers()
  const key = getClientKey(requestHeaders, userId)
  try {
    const result = await apiLimiter.limit(`add:${key}`)
    if (!result.success) {
      redirect(`/products/${productSlug}?error=rate_limit`)
    }
  } catch {
    redirect(`/products/${productSlug}?error=unavailable`)
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      status: true,
      isHidden: true,
      priceCents: true,
      stockMode: true,
    },
  })

  if (
    !product ||
    product.status !== 'ACTIVE' ||
    product.isHidden ||
    product.slug !== productSlug
  ) {
    redirect(`/products/${productSlug}?error=unavailable`)
  }

  const cart = await getOrCreateCart(userId)

  // MADE_TO_ORDER skips inventory item reservation — there is no per-unit
  // row to claim. The order is sized at fulfillment.
  if (product.stockMode === 'MADE_TO_ORDER') {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: 1,
        unitPriceCents: product.priceCents,
      },
    })
    revalidatePath('/bag')
    redirect('/bag?added=1')
  }

  // Per-unit reservation — atomic against concurrent adds.
  const reservation = await reserveOneForCart({
    productId: product.id,
    cartId: cart.id,
    actorId: userId,
  })

  if (!reservation.ok) {
    redirect(`/products/${productSlug}?error=no_stock`)
  }

  try {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        inventoryItemId: reservation.item.id,
        quantity: 1,
        unitPriceCents: product.priceCents,
      },
    })
  } catch (err) {
    // If CartItem creation fails for any reason (e.g., the unique on
    // inventoryItemId fires because another race wrote first), undo the
    // reservation so the unit goes back to AVAILABLE.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      await releaseReservation({
        inventoryItemId: reservation.item.id,
        cartId: cart.id,
        actorId: userId,
        reason: 'cart.add.dedupe',
      })
      redirect(`/products/${productSlug}?error=already_in_bag`)
    }
    throw err
  }

  revalidatePath('/bag')
  redirect('/bag?added=1')
}

export async function removeFromBag(formData: FormData) {
  const parsed = removeInput.safeParse({
    cartItemId: formData.get('cartItemId'),
  })
  if (!parsed.success) redirect('/bag?error=invalid')
  const { cartItemId } = parsed.data

  const token = await getCartToken()
  if (!token) redirect('/bag')

  const session = await auth()
  const userId = session?.user?.id ?? null

  // Confirm the item belongs to *this* cookie's cart. Never allow
  // cross-cart deletion based on cartItemId alone.
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: {
      id: true,
      cartId: true,
      inventoryItemId: true,
      cart: { select: { token: true } },
    },
  })

  if (!item || item.cart.token !== token) {
    redirect('/bag')
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.delete({ where: { id: cartItemId } })
  })

  if (item.inventoryItemId) {
    await releaseReservation({
      inventoryItemId: item.inventoryItemId,
      cartId: item.cartId,
      actorId: userId,
      reason: 'cart.remove',
    })
  }

  revalidatePath('/bag')
  redirect('/bag?removed=1')
}
