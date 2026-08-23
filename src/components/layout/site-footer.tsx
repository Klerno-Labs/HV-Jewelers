import Link from 'next/link'
import { Container } from './container'
import { Brand } from './brand'
import { BUSINESS } from '@/lib/business'

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
              Hoang Vi · Fine jewelry
            </p>
            <p className="mt-6 text-caption leading-relaxed text-ink-soft">
              A small, considered collection of fine jewelry, stocked one
              piece per design and photographed in our Houston shop.
            </p>

            {/* Storefront identity. Present on every page because the
                Misrepresentation check reads the site as a whole, not just
                the contact page. Kept in sync with `BUSINESS` and with the
                Merchant Center business-information record. */}
            <address className="mt-6 space-y-1 text-caption not-italic leading-relaxed text-ink-soft">
              <p>{BUSINESS.address.street}</p>
              <p>
                {BUSINESS.address.city}, {BUSINESS.address.region}{' '}
                {BUSINESS.address.postalCode}
              </p>
              <p className="pt-2">
                <a
                  href={`tel:${BUSINESS.telephone}`}
                  className="transition-colors duration-300 hover:text-olive"
                >
                  {BUSINESS.telephoneDisplay}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="transition-colors duration-300 hover:text-olive"
                >
                  {BUSINESS.email}
                </a>
              </p>
              <p className="pt-2 text-ink-muted">{BUSINESS.hours}</p>
            </address>

            {/* Accepted payment methods, verified against Shopify's own
                paymentSettings (acceptedCardBrands + supportedDigitalWallets)
                rather than assumed. Google's Misrepresentation review checks
                that accepted methods are clearly displayed; nothing on the
                site named any until this. */}
            <p className="mt-6 text-caption leading-relaxed text-ink-soft">
              We accept Visa, Mastercard, American Express, Discover, and
              Diners Club, plus Shop&nbsp;Pay, Apple&nbsp;Pay, and
              Google&nbsp;Pay at checkout.
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
