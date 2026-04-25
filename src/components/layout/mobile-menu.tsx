'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
}

export function MobileMenu({
  primary,
  secondary,
}: {
  primary: NavItem[]
  secondary: NavItem[]
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close on route change.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the menu is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // ESC closes.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
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
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 flex flex-col bg-parchment lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-limestone-deep/60 px-6 md:h-20 md:px-10">
            <span className="font-serif text-title text-ink">HV Jewelers</span>
            <button
              type="button"
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
