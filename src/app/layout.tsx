import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Analytics } from '@vercel/analytics/next'
import { PinterestTag } from '@/components/analytics/pinterest-tag'
import { businessSchema } from '@/lib/business'
import './globals.css'

const serifDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif-display',
  display: 'swap',
})

const sansUi = Inter({
  subsets: ['latin'],
  variable: '--font-sans-ui',
  display: 'swap',
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://hvjewelers.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HV Jewelers | One-of-a-Kind Fine Jewelry in Houston',
    template: '%s | HV Jewelers',
  },
  description:
    'Shop one-of-a-kind rings, earrings, necklaces, pendants, and bracelets from the Premier Jewelers Houston showroom, with insured US shipping and private viewings.',
  applicationName: 'HV Jewelers',
  authors: [{ name: 'Hoang Vi Jewelers' }],
  openGraph: {
    type: 'website',
    siteName: 'HV Jewelers',
    title: 'HV Jewelers | One-of-a-Kind Fine Jewelry in Houston',
    description:
      'Fine jewelry from the Premier Jewelers Houston showroom: one piece per design, available online or for a private in-store viewing.',
    locale: 'en_US',
    images: [
      {
        url: '/brand/wordmark.png',
        width: 1024,
        height: 1024,
        alt: 'HV Jewelers',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'HV Jewelers | One-of-a-Kind Fine Jewelry in Houston',
    description:
      'Fine jewelry from the Premier Jewelers Houston showroom, one piece per design.',
    images: ['/brand/wordmark.png'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
}

export const viewport: Viewport = {
  themeColor: '#f2ebd7',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${serifDisplay.variable} ${sansUi.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-parchment font-sans text-body text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessSchema(siteUrl)),
          }}
        />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
        <PinterestTag />
      </body>
    </html>
  )
}
