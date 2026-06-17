import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { SmoothScrollProvider } from '@/components/immersive/smooth-scroll-provider'
import { StructuredData } from '@/components/seo/structured-data'
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
    default: 'Gold Chains, Necklaces & Fine Jewelry | HV Jewelers',
    template: '%s | HV Jewelers',
  },
  description:
    'HV Jewelers (Hoang Vi) — gold chains, necklaces, bracelets, earrings, and fine jewelry, ready to wear and shipped to your door. A family jeweler since 2005.',
  applicationName: 'HV Jewelers',
  authors: [{ name: 'HV Jewelers (Hoang Vi)' }],
  keywords: [
    'gold chains',
    'gold necklaces',
    'gold bracelets',
    'gold earrings',
    'gold pendants',
    'gold rings',
    'fine jewelry online',
    '14k gold jewelry',
    'ready to wear jewelry',
    'gold jewelry',
  ],
  category: 'Jewelry',
  // Public pages inherit indexable defaults from Next's built-in policy.
  // Internal/transactional surfaces (admin, login, account, design-system
  // specs) override with their own `robots: { index: false }` metadata.
  // robots.txt is the belt-and-suspenders gate.
  openGraph: {
    type: 'website',
    siteName: 'HV Jewelers',
    title: 'Gold Chains, Necklaces & Fine Jewelry | HV Jewelers',
    description:
      'Gold chains, necklaces, bracelets, earrings, and fine jewelry — ready to wear and shipped to your door. A family jeweler since 2005.',
    locale: 'en_US',
    images: [
      {
        url: '/brand/wordmark-cream.png',
        width: 1024,
        height: 1024,
        alt: 'HV Jewelers — gold chains, necklaces & fine jewelry',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Gold Chains, Necklaces & Fine Jewelry | HV Jewelers',
    description:
      'Gold chains, necklaces, bracelets, earrings, and fine jewelry — ready to wear and shipped to your door. A family jeweler since 2005.',
    images: ['/brand/wordmark-cream.png'],
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
        <StructuredData />
        <SmoothScrollProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
