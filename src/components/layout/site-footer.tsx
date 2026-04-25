import Link from 'next/link'
import { Container } from './container'

const footerNav: Record<string, { label: string; href: string }[]> = {
  Shop: [
    { label: 'Vintage Era', href: '/collections/vintage-era' },
    { label: 'Near Vintage', href: '/collections/near-vintage' },
    { label: 'Modern Fine Jewelry', href: '/collections/modern-fine-jewelry' },
    { label: 'Gold', href: '/collections/gold' },
    { label: 'Pearls', href: '/collections/pearls' },
    { label: 'New Arrivals', href: '/collections/new-arrivals' },
  ],
  'The House': [
    { label: 'About Hong Vi', href: '/about' },
    { label: 'Journal', href: '/journal' },
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
            <p className="font-serif text-heading text-ink">HV Jewelers</p>
            <p className="mt-3 text-eyebrow text-ink-muted">
              Hong Vi · A small archive
            </p>
            <p className="mt-6 text-caption leading-relaxed text-ink-soft">
              Quietly sourced pieces across Vintage Era, Near Vintage,
              and Modern Fine Jewelry. All unworn. Verified in person
              before they go on the site.
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
