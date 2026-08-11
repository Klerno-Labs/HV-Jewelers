/**
 * Business identity, in one place.
 *
 * Google Merchant Center flagged this store under the Misrepresentation
 * policy, which blocks every product from showing. The trigger was that
 * the site published no verifiable identity at all: no address, no phone,
 * no trading history, just an email address behind a catalog of
 * four-figure jewelry. Google's automated check reads that as a business
 * it cannot identify.
 *
 * These constants are the single source for the footer, the contact page,
 * and the LocalBusiness structured data. The values must also match what
 * is entered in Merchant Center under Settings → Business information:
 * a mismatch between the site and the Merchant Center record is itself a
 * flag, so change them here and there together, never one alone.
 */

export const BUSINESS = {
  /** Trading name used across the storefront. */
  name: 'HV Jewelers',
  /** Long form used in structured data and legal copy. */
  legalName: 'Hoang Vi Jewelers',
  email: 'concierge@hvjewelers.com',
  /** Same line Premier publishes; consistency across both sites helps verification. */
  telephone: '+1-281-955-6855',
  /** Human-readable form for display. */
  telephoneDisplay: '(281) 955-6855',
  address: {
    street: '12264 FM 1960 Rd W, Suite A',
    city: 'Houston',
    region: 'TX',
    postalCode: '77065',
    country: 'US',
  },
  /** Houston is Central. The site previously said ET, which was simply wrong. */
  hours: 'Monday to Friday, 10 to 5 CT',
  openingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '10:00',
    closes: '17:00',
  },
} as const

/** "12264 FM 1960 Rd W, Suite A, Houston, TX 77065" */
export function formattedAddress(): string {
  const { street, city, region, postalCode } = BUSINESS.address
  return `${street}, ${city}, ${region} ${postalCode}`
}

/**
 * JewelryStore is a LocalBusiness subtype, which is what Google wants for
 * a physical retailer: it carries the address, phone, and hours that the
 * Misrepresentation check looks for, in a form a machine can read without
 * parsing page copy.
 */
export function businessSchema(siteUrl: string) {
  const { street, city, region, postalCode, country } = BUSINESS.address
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${siteUrl}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: siteUrl,
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    image: `${siteUrl}/brand/wordmark.png`,
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: street,
      addressLocality: city,
      addressRegion: region,
      postalCode,
      addressCountry: country,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [...BUSINESS.openingHours.days],
        opens: BUSINESS.openingHours.opens,
        closes: BUSINESS.openingHours.closes,
      },
    ],
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
  }
}
