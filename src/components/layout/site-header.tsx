import Link from 'next/link'
import { Container } from './container'
import { Brand } from './brand'
import { MobileMenu } from './mobile-menu'
import { ShopCartLauncher } from '@/components/shop/shop-cart-drawer'
import { getCart } from '@/lib/shopify/cart'

const primaryNav = [
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Concierge', href: '/contact' },
]

const secondaryNav = [
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Concierge', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
  { label: 'Care', href: '/care' },
  { label: 'Account', href: '/account' },
]

export async function SiteHeader() {
  const initialCart = await getCart()

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
          className="group inline-flex items-baseline transition-opacity duration-300 hover:opacity-80"
          aria-label="HV Jewelers, home"
        >
          <Brand size="md" showSubtitle />
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
            href="/account"
            className="hidden text-caption text-ink-soft transition-colors duration-300 hover:text-olive sm:inline"
          >
            Account
          </Link>
          <ShopCartLauncher initialCart={initialCart} />
          <MobileMenu primary={primaryNav} secondary={secondaryNav} />
        </div>
      </Container>
    </header>
  )
}
