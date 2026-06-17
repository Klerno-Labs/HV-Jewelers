/**
 * Sitewide JSON-LD structured data. Establishes the HV Jewelers brand
 * as a recognized entity (Organization + WebSite) so search engines can
 * attribute reviews, knowledge-panel facts, and sitelinks. Rendered once
 * in the root layout; per-product Product schema is emitted on PDPs.
 *
 * Entity facts (founding year, languages, contact) come from the real
 * business — a family jeweler operating since 2005 — which feeds Google's
 * E-E-A-T (experience/expertise/authority) signals.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hvjewelers.com'

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: 'HV Jewelers',
  alternateName: ['Hoang Vi Jewelers', 'Premier Jewelers Hoang Vi'],
  url: siteUrl,
  logo: `${siteUrl}/brand/wordmark-cream.png`,
  image: `${siteUrl}/brand/wordmark-cream.png`,
  foundingDate: '2005',
  description:
    'Family-owned fine jeweler offering gold chains, necklaces, bracelets, earrings, and ready-to-wear fine jewelry, shipped to your door.',
  knowsLanguage: ['en', 'vi', 'es'],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-281-955-6855',
    email: 'concierge@hvjewelers.com',
    contactType: 'customer service',
    availableLanguage: ['English', 'Vietnamese', 'Spanish'],
  },
}

const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  url: siteUrl,
  name: 'HV Jewelers',
  description:
    'Gold chains, necklaces, bracelets, earrings, and fine jewelry from a family jeweler since 2005.',
  publisher: { '@id': `${siteUrl}/#organization` },
  inLanguage: 'en-US',
}

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  )
}
