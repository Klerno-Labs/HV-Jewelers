import Link from 'next/link'
import { Container } from './container'
import { MobileMenu } from './mobile-menu'
import { getCartItemCount } from '@/lib/cart/cart'

const primaryNav = [
  { label: 'Vintage Era', href: '/collections/vintage-era' },
  { label: 'Near Vintage', href: '/collections/near-vintage' },
  { label: 'Modern Fine', href: '/collections/modern-fine-jewelry' },
  { label: 'Gold', href: '/collections/gold' },
  { label: 'Pearls', href: '/collections/pearls' },
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
]

const secondaryNav = [
  { label: 'Journal', href: '/journal' },
  { label: 'About', href: '/about' },
  { label: 'Concierge', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
  { label: 'Care', href: '/care' },
  { label: 'Account', href: '/account' },
]

export async function SiteHeader() {
  const bagCount = await getCartItemCount()

  return (
    <header
      className="sticky top-0 z-40 border-b border-limestone-deep/60 bg-parchment/85 backdrop-blur-sm"
      aria-label="Site"
    >
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-3 focus-visible:z-50 focus-visible:bg-ink focus-visible:text-parchment focus-visible:px-4 focus-visible:py-2 focus-visible:text-caption"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center justify-between gap-6 md:h-20">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-3 transition-opacity duration-300 hover:opacity-80"
          aria-label="HV Jewelers, home"
        >
          <span className="font-serif text-title leading-none tracking-tight text-ink">
            HV Jewelers
          </span>
          <span className="hidden text-eyebrow text-ink-muted md:inline">
            Hong Vi
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-8">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-caption tracking-wide text-ink-soft transition-colors duration-300 hover:text-olive"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/journal"
            className="hidden text-caption text-ink-soft transition-colors duration-300 hover:text-olive xl:inline"
          >
            Journal
          </Link>
          <Link
            href="/account"
            className="hidden text-caption text-ink-soft transition-colors duration-300 hover:text-olive sm:inline"
          >
            Account
          </Link>
          <Link
            href="/bag"
            className="text-caption text-ink-soft transition-colors duration-300 hover:text-olive"
            aria-label={`Shopping bag, ${bagCount} ${bagCount === 1 ? 'piece' : 'pieces'}`}
          >
            Bag <span className="tabular-nums">({bagCount})</span>
          </Link>
          <MobileMenu primary={primaryNav} secondary={secondaryNav} />
        </div>
      </Container>
    </header>
  )
}
