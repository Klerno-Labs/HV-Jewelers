import Link from 'next/link'
import { Container } from './container'
import { Brand } from './brand'

const footerNav: Record<string, { label: string; href: string }[]> = {
  Shop: [
    { label: 'The Shop', href: '/shop' },
  ],
  'The House': [
    { label: 'About Hoang Vi', href: '/about' },
    { label: 'Concierge', href: '/contact' },
  ],
  Care: [
    { label: 'Shipping', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'Resizing & Care', href: '/care' },
    { label: 'Account', href: '/account' },
  ],
}

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 border-t border-limestone-deep/60 bg-limestone/40">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Brand size="lg" />
            <p className="mt-3 text-eyebrow text-ink-muted">
              Hoang Vi · Since 2005
            </p>
            <p className="mt-6 text-caption leading-relaxed text-ink-soft">
              Gold and fine jewelry — chains, necklaces, bracelets,
              earrings, and pendants. One of each piece. A family jeweler
              since 2005, shipped to your door.
            </p>
          </div>
          {Object.entries(footerNav).map(([heading, items]) => (
            <div key={heading}>
              <p className="mb-5 text-eyebrow text-ink-muted">{heading}</p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-caption text-ink-soft transition-colors duration-300 hover:text-olive"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-limestone-deep/60 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-caption text-ink-muted">
            © {year} HV Jewelers. All rights reserved.
          </p>
          <ul className="flex items-center gap-6 text-caption text-ink-muted">
            <li>
              <Link href="/privacy" className="transition-colors hover:text-olive">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-olive">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/accessibility" className="transition-colors hover:text-olive">
                Accessibility
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  )
}
