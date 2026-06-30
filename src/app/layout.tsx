import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Analytics } from '@vercel/analytics/next'
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HV Jewelers · Hoang Vi',
    template: '%s · HV Jewelers',
  },
  description:
    'Hoang Vi Jewelers — a small collection of fine jewelry: bands, solitaires, chain, and stones, each chosen and verified in person.',
  applicationName: 'HV Jewelers',
  authors: [{ name: 'Hoang Vi Jewelers' }],
  // Public pages inherit indexable defaults from Next's built-in policy.
  // Internal/transactional surfaces (admin, login, account, design-system
  // specs) override with their own `robots: { index: false }` metadata.
  // robots.txt is the belt-and-suspenders gate.
  openGraph: {
    type: 'website',
    siteName: 'HV Jewelers',
    title: 'HV Jewelers · Hoang Vi',
    description:
      'A small collection of fine jewelry — bands, solitaires, chain, and stones, verified in person.',
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
    title: 'HV Jewelers · Hoang Vi',
    description:
      'A small collection of fine jewelry — bands, solitaires, chain, and stones, verified in person.',
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
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* Headless traffic analytics — captures visitors/sessions the Vercel
            frontend serves (Shopify's online-store analytics can't see them). */}
        <Analytics />
      </body>
    </html>
  )
}
