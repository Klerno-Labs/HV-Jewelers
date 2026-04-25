import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'

/**
 * Cart cookie + read helpers. Phase 5 builds only the read path so the
 * site header can show a bag count and the /bag page can render. The
 * mutation path (add to bag, remove from bag, reserve inventory) lands
 * in Phase 7 alongside the product detail page.
 *
 * Cookie design:
 *   • Opaque token, 24 random bytes base64url-encoded.
 *   • httpOnly + Secure (in prod) + SameSite=Lax + path=/.
 *   • 30-day expiry on browser; cart row's `expiresAt` is the server
 *     side of truth and a cron will mark abandoned carts later.
 */

export const CART_COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Secure-hv.cart' : 'hv.cart'
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000

export function generateCartToken(): string {
  return randomBytes(24).toString('base64url')
}

export async function getCartToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE_NAME)?.value ?? null
}

export async function setCartCookie(token: string) {
  const store = await cookies()
  store.set(CART_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CART_TTL_MS / 1000,
  })
}

export async function clearCartCookie() {
  const store = await cookies()
  store.delete(CART_COOKIE_NAME)
}

/**
 * Returns the user-facing item count for the header bag. Fail-soft on
 * errors (no DB, missing table, etc.) so the storefront chrome cannot
 * be broken by an infrastructure blip.
 */
export async function getCartItemCount(): Promise<number> {
  try {
    const token = await getCartToken()
    if (!token) return 0
    const cart = await prisma.cart.findUnique({
      where: { token },
      select: {
        status: true,
        expiresAt: true,
        _count: { select: { items: true } },
      },
    })
    if (!cart) return 0
    if (cart.status !== 'OPEN') return 0
    if (cart.expiresAt < new Date()) return 0
    return cart._count.items
  } catch {
    return 0
  }
}

export async function getOpenCart() {
  try {
    const token = await getCartToken()
    if (!token) return null
    const cart = await prisma.cart.findUnique({
      where: { token },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                title: true,
                era: true,
                priceCents: true,
                currency: true,
                images: {
                  orderBy: { position: 'asc' },
                  take: 1,
                  select: { url: true, alt: true, width: true, height: true },
                },
              },
            },
          },
        },
      },
    })
    if (!cart) return null
    if (cart.status !== 'OPEN') return null
    if (cart.expiresAt < new Date()) return null
    return cart
  } catch {
    return null
  }
}

export type OpenCart = NonNullable<Awaited<ReturnType<typeof getOpenCart>>>
