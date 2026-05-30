'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useFormStatus } from 'react-dom'
import {
  fetchCartAction,
  removeCartLineAction,
  startShopifyCheckoutAction,
  updateCartLineAction,
} from '@/app/shop/actions'
import { formatMoney } from '@/lib/shopify/money'
import type { ShopifyCart } from '@/lib/shopify/types'
import { cn } from '@/lib/cn'

/**
 * Slide-out cart drawer. Mounted alongside the header bag button.
 * Initial cart is hydrated by the server; subsequent mutations update
 * local state directly from server-action return values so the drawer
 * never goes stale waiting on a refetch.
 *
 * Accessibility:
 *  - role=dialog + aria-modal
 *  - Focus moves to Close on open, restores to the launcher on close
 *  - Tab/Shift+Tab cycle within the drawer (focus trap)
 *  - ESC closes
 *  - Polite live region announces cart updates
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ShopCartLauncher({
  initialCart,
}: {
  initialCart: ShopifyCart | null
}) {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<ShopifyCart | null>(initialCart)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<string>('')

  const launcherRef = useRef<HTMLButtonElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // Re-sync local state when the server-rendered layout pushes a new
  // initialCart (e.g. after PDP add-to-cart triggers a layout refresh).
  useEffect(() => {
    setCart(initialCart)
  }, [initialCart])

  // Body scroll lock + ESC to close. iOS-safe: fix the body and stash
  // scroll position so the page doesn't rubber-band under the drawer.
  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const body = document.body
    const prevPosition = body.style.position
    const prevTop = body.style.top
    const prevWidth = body.style.width
    const prevOverflow = body.style.overflow
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
      if (e.key === 'Tab') trapTab(e)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.width = prevWidth
      body.style.overflow = prevOverflow
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Move focus into the dialog on open; restore to launcher on close.
  useEffect(() => {
    if (open) {
      returnFocusRef.current =
        (document.activeElement as HTMLElement | null) ?? launcherRef.current
      // Defer to next frame so the dialog is in the DOM and focusable.
      const id = requestAnimationFrame(() => {
        closeRef.current?.focus()
      })
      return () => cancelAnimationFrame(id)
    }
    if (returnFocusRef.current) {
      returnFocusRef.current.focus()
      returnFocusRef.current = null
    } else {
      launcherRef.current?.focus()
    }
  }, [open])

  const trapTab = useCallback((e: KeyboardEvent) => {
    const root = dialogRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
    )
    if (items.length === 0) return
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  const count = cart?.totalQuantity ?? 0

  function announce(cart: ShopifyCart | null, prefix: string) {
    if (!cart) {
      setStatus(`${prefix}. Bag is empty.`)
      return
    }
    const subtotal = formatMoney(cart.cost.subtotalAmount)
    setStatus(
      `${prefix}. ${cart.totalQuantity} ${cart.totalQuantity === 1 ? 'piece' : 'pieces'} in bag. Subtotal ${subtotal}.`,
    )
  }

  function refresh() {
    startTransition(async () => {
      const result = await fetchCartAction()
      if (result.cart) setCart(result.cart)
    })
  }

  function updateLine(lineId: string, nextQty: number, title: string) {
    startTransition(async () => {
      const result = await updateCartLineAction(lineId, nextQty)
      if (result.cart) {
        setCart(result.cart)
        announce(result.cart, nextQty === 0 ? `Removed ${title} from bag` : 'Bag updated')
      } else if (result.userErrors.length > 0) {
        setStatus(result.userErrors[0]?.message ?? 'Could not update bag.')
      }
    })
  }

  function removeLine(lineId: string, title: string) {
    startTransition(async () => {
      const result = await removeCartLineAction(lineId)
      if (result.cart) {
        setCart(result.cart)
        announce(result.cart, `Removed ${title} from bag`)
      } else if (result.userErrors.length > 0) {
        setStatus(result.userErrors[0]?.message ?? 'Could not remove item.')
      }
    })
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Shopping bag, ${count} ${count === 1 ? 'piece' : 'pieces'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="text-caption text-ink-soft transition-colors duration-300 hover:text-olive"
      >
        Bag <span className="tabular-nums">({count})</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping bag"
          ref={dialogRef}
        >
          <button
            type="button"
            aria-label="Close bag"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
          />
          <div
            className={cn(
              'absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col bg-parchment shadow-float',
            )}
          >
            <div className="flex items-center justify-between border-b border-limestone-deep/60 px-6 py-5">
              <p className="font-serif text-title text-ink">
                Bag{' '}
                <span className="ml-1 text-caption text-ink-muted tabular-nums">
                  ({count})
                </span>
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="text-caption text-ink-soft hover:text-olive focus-visible:outline-2 focus-visible:outline-bronze"
              >
                Close
              </button>
            </div>

            {/* Polite live region for screen readers. */}
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {status}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {!cart || cart.lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-eyebrow text-bronze">Quiet for now</p>
                  <p className="mt-6 font-serif text-heading text-ink">
                    Your bag is empty.
                  </p>
                  <p className="mt-4 max-w-xs text-body leading-relaxed text-ink-soft">
                    A small selection of pieces is in the case. Have a look.
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className="mt-8 text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
                  >
                    Browse the shop →
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-limestone-deep/60">
                  {cart.lines.map((line) => {
                    const productTitle = line.merchandise.product.title
                    const variantTitle = line.merchandise.title
                    return (
                      <li key={line.id} className="flex gap-4 py-5">
                        <Link
                          href={`/shop/${line.merchandise.product.handle}`}
                          onClick={() => setOpen(false)}
                          className="block h-24 w-20 shrink-0 overflow-hidden bg-limestone"
                        >
                          {line.merchandise.image ? (
                            <Image
                              src={line.merchandise.image.url}
                              alt=""
                              width={line.merchandise.image.width ?? 240}
                              height={line.merchandise.image.height ?? 300}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-serif text-title text-ink/30">
                              {productTitle.charAt(0)}
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/shop/${line.merchandise.product.handle}`}
                            onClick={() => setOpen(false)}
                            className="block font-serif text-body text-ink hover:text-olive"
                          >
                            {productTitle}
                          </Link>
                          {line.merchandise.selectedOptions.length > 0 &&
                            line.merchandise.selectedOptions[0]?.name !== 'Title' && (
                              <p className="mt-1 text-caption text-ink-muted">
                                {line.merchandise.selectedOptions
                                  .map((o) => `${o.name}: ${o.value}`)
                                  .join(' · ')}
                              </p>
                            )}
                          <p className="mt-1 text-caption tabular-nums text-ink-soft">
                            {formatMoney(line.cost.amountPerQuantity)}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center border border-limestone-deep/80">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  line.quantity === 1
                                    ? removeLine(line.id, productTitle)
                                    : updateLine(line.id, line.quantity - 1, productTitle)
                                }
                                aria-label={
                                  line.quantity === 1
                                    ? `Remove ${productTitle} from bag`
                                    : `Decrease quantity of ${productTitle}`
                                }
                                className="h-8 w-8 text-caption text-ink-soft hover:text-olive disabled:opacity-50"
                              >
                                −
                              </button>
                              <span className="px-3 text-caption tabular-nums text-ink">
                                <span className="sr-only">
                                  {productTitle}{variantTitle && variantTitle !== 'Default Title' ? `, ${variantTitle}` : ''}, quantity{' '}
                                </span>
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => updateLine(line.id, line.quantity + 1, productTitle)}
                                aria-label={`Increase quantity of ${productTitle}`}
                                className="h-8 w-8 text-caption text-ink-soft hover:text-olive disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => removeLine(line.id, productTitle)}
                              aria-label={`Remove ${productTitle} from bag`}
                              className="text-caption text-ink-muted underline underline-offset-4 decoration-bronze/40 hover:text-cedar-deep disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {cart && cart.lines.length > 0 && (
              <div className="border-t border-limestone-deep/60 bg-parchment-warm/40 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between">
                  <p className="text-caption text-ink-soft">Subtotal</p>
                  <p className="font-serif text-title text-ink tabular-nums">
                    {formatMoney(cart.cost.subtotalAmount)}
                  </p>
                </div>
                <p className="mt-2 text-caption text-ink-muted">
                  Shipping and taxes calculated at checkout.
                </p>
                <form action={startShopifyCheckoutAction} className="mt-5">
                  <CheckoutSubmitButton disabled={pending} />
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function CheckoutSubmitButton({ disabled }: { disabled?: boolean }) {
  // Read the form's own pending state so the button label updates
  // while Shopify is generating the checkout URL and the redirect
  // is in flight.
  const { pending } = useFormStatus()
  const isPending = pending || disabled
  return (
    <button
      type="submit"
      disabled={isPending}
      className="inline-flex h-12 w-full items-center justify-center bg-ink px-6 text-eyebrow text-parchment transition-colors hover:bg-olive-deep disabled:opacity-50"
    >
      {pending ? 'Redirecting…' : 'Checkout →'}
    </button>
  )
}
