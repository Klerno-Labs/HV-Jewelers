'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brand } from './brand'

interface NavItem {
  label: string
  href: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function MobileMenu({
  primary,
  secondary,
}: {
  primary: NavItem[]
  secondary: NavItem[]
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // Auto-close on route change (covers programmatic navigations).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // iOS-safe body scroll lock.
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
    return () => {
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.width = prevWidth
      body.style.overflow = prevOverflow
      window.scrollTo(0, scrollY)
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
    } else if (active === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  // ESC closes + focus trap while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'Tab') trapTab(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, trapTab])

  // Move focus into the dialog on open; restore on close.
  useEffect(() => {
    if (open) {
      returnFocusRef.current =
        (document.activeElement as HTMLElement | null) ?? triggerRef.current
      const id = requestAnimationFrame(() => {
        closeRef.current?.focus()
      })
      return () => cancelAnimationFrame(id)
    }
    if (returnFocusRef.current) {
      returnFocusRef.current.focus()
      returnFocusRef.current = null
    } else {
      triggerRef.current?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
        className="text-caption tracking-wide text-ink-soft transition-colors duration-300 hover:text-olive lg:hidden"
      >
        {open ? 'Close' : 'Menu'}
      </button>

      {open ? (
        <div
          ref={dialogRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 flex flex-col bg-parchment lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-limestone-deep/60 px-6 md:h-20 md:px-10">
            <Brand size="md" />
            <button
              ref={closeRef}
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="text-caption tracking-wide text-ink-soft transition-colors duration-300 hover:text-olive"
            >
              Close
            </button>
          </div>
          <nav
            aria-label="Primary"
            className="flex-1 overflow-y-auto px-6 py-12 md:px-10"
          >
            <p className="text-eyebrow text-ink-muted">Collections</p>
            <ul className="mt-6 space-y-4">
              {primary.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="font-serif text-heading text-ink transition-colors duration-300 hover:text-olive"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-12 text-eyebrow text-ink-muted">The House</p>
            <ul className="mt-6 space-y-3">
              {secondary.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="text-body text-ink-soft transition-colors duration-300 hover:text-olive"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </>
  )
}
