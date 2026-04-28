import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
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
    'Hoang Vi Jewelers. A small archive of unworn jewelry: Vintage Era, Near Vintage, and modern fine pieces.',
  applicationName: 'HV Jewelers',
  authors: [{ name: 'Hoang Vi Jewelers' }],
  // Public pages inherit indexable defaults from Next's built-in policy.
  // Internal/transactional surfaces (admin, checkout, login, account,
  // bag, design-system specs) override with their own `robots: { index:
  // false }` metadata. robots.txt is the belt-and-suspenders gate.
  openGraph: {
    type: 'website',
    siteName: 'HV Jewelers',
    title: 'HV Jewelers · Hoang Vi',
    description:
      'A small archive of unworn Vintage Era, Near Vintage, and modern fine jewelry.',
    locale: 'en_US',
  },
  icons: {
    icon: '/favicon.ico',
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
      </body>
    </html>
  )
}
