import { listAllProducts } from '@/lib/shopify/products'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Google Merchant Center product feed (RSS 2.0 + the `g:` namespace).
 *
 * Why this exists rather than the Shopify Google & YouTube channel: the
 * storefront is headless. That channel builds landing pages as
 * `/products/<handle>` against the store's primary domain, but the pages
 * live at `/shop/<handle>` here — so every submitted URL 404s and items
 * sit unapproved. `next.config.ts` now redirects those URLs as a safety
 * net; this feed is the direct fix, submitting the real URL up front.
 *
 * Point Merchant Center at https://hvjewelers.com/google-feed.xml as a
 * scheduled fetch (daily) and disable the channel's own primary feed so
 * the two don't fight over the same item IDs.
 */

export const revalidate = 3600

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hvjewelers.com'
).replace(/\/$/, '')

const BRAND = 'HV Jewelers'

/**
 * Shopify `productType` → Google product taxonomy.
 *
 * Full category paths rather than numeric IDs: Google accepts either,
 * and the text form survives taxonomy renumbering and reads correctly
 * in a diff. Every type currently in the catalog is mapped; anything
 * new falls back to the parent Jewelry node rather than going out
 * uncategorized.
 */
const GOOGLE_CATEGORY: Record<string, string> = {
  Necklaces: 'Apparel & Accessories > Jewelry > Necklaces',
  Pendants: 'Apparel & Accessories > Jewelry > Charms & Pendants',
  Earrings: 'Apparel & Accessories > Jewelry > Earrings',
  Rings: 'Apparel & Accessories > Jewelry > Rings',
  Bracelets: 'Apparel & Accessories > Jewelry > Bracelets',
}
const FALLBACK_CATEGORY = 'Apparel & Accessories > Jewelry'

/**
 * Merchant Center return policy label for the final-sale exception.
 *
 * Merchant Center held a single "Standard for United States" policy —
 * 15 days, returns free — applied to all 171 items, while /returns and
 * the product JSON-LD say the buyer pays return shipping and that
 * earrings cannot be returned at all. Google's automated check compares
 * the two and reads the gap as misrepresentation.
 *
 * Only the exception carries a label. Items without one fall back to the
 * account-level policy, so the other 120 stay governed by a single
 * policy instead of two that can drift apart.
 *
 * This string must already exist in Merchant Center under
 * Settings → Return policies before the feed ships it. A label Google
 * doesn't recognise disapproves every item carrying it, which would take
 * out all 51 earrings at once.
 */
const FINAL_SALE_LABEL = 'final-sale-earrings'

/**
 * Mirrors `isEarrings` on the product page, deliberately by the same rule
 * on the same field: the feed and the landing page must classify a piece
 * identically or the mismatch this label exists to close simply moves.
 */
function isFinalSale(product: ShopifyProduct): boolean {
  return (product.productType || '').trim() === 'Earrings'
}

/** Google caps description at 5000 characters. */
const DESCRIPTION_LIMIT = 5000
/** `additional_image_link` accepts at most 10. */
const MAX_ADDITIONAL_IMAGES = 10

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** "1300.00 USD" — Google wants a bare decimal plus ISO currency. */
function formatPrice(amount: string, currency: string): string {
  return `${Number(amount).toFixed(2)} ${currency}`
}

/**
 * Description is required — an item without one is disapproved. Four
 * catalog entries currently ship with no copy in Shopify, so this
 * synthesizes a factual line to keep them eligible. That's a floor to
 * stop disapprovals, not a substitute: real copy belongs in Shopify.
 *
 * Phrased off the plural `productType` as-is ("fine earrings", "fine
 * necklaces") to sidestep singularization and a/an agreement entirely.
 */
function feedDescription(product: ShopifyProduct): string {
  const written = (product.description ?? '').replace(/\s+/g, ' ').trim()
  if (written) return written.slice(0, DESCRIPTION_LIMIT)

  const kind = product.productType.trim().toLowerCase() || 'jewelry'
  return (
    `${product.title} — fine ${kind} from ${BRAND}, ` +
    `shipped insured within the United States.`
  )
}

function itemXml(product: ShopifyProduct): string | null {
  const variant = product.variants[0]
  const image = product.featuredImage ?? product.images[0]

  // No sellable variant or no image means Google would reject the item
  // anyway; skipping keeps the feed clean rather than shipping a known
  // rejection. Every product currently satisfies both.
  if (!variant || !image) return null

  // Google's convention: `price` carries the regular price and
  // `sale_price` the discounted one. Shopify models that inversely —
  // `price` is what you pay now, `compareAtPrice` the was-price.
  const current = variant.price
  const compareAt = variant.compareAtPrice
  const onSale =
    compareAt != null && Number(compareAt.amount) > Number(current.amount)

  const regularPrice = onSale
    ? formatPrice(compareAt.amount, compareAt.currencyCode)
    : formatPrice(current.amount, current.currencyCode)
  const salePrice = onSale
    ? formatPrice(current.amount, current.currencyCode)
    : null

  const additionalImages = product.images
    .map((i) => i.url)
    .filter((url) => url !== image.url)
    .slice(0, MAX_ADDITIONAL_IMAGES)

  const category =
    GOOGLE_CATEGORY[product.productType.trim()] ?? FALLBACK_CATEGORY

  const lines = [
    '    <item>',
    //  SKU is unique across the catalog and stable across re-syncs, which
    //  is exactly what Google wants for an item ID.
    `      <g:id>${escapeXml(variant.sku ?? product.handle)}</g:id>`,
    `      <title>${escapeXml(product.title)}</title>`,
    `      <description>${escapeXml(feedDescription(product))}</description>`,
    `      <link>${escapeXml(`${SITE_URL}/shop/${product.handle}`)}</link>`,
    `      <g:image_link>${escapeXml(image.url)}</g:image_link>`,
    ...additionalImages.map(
      (url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
    ),
    `      <g:availability>${product.availableForSale ? 'in_stock' : 'out_of_stock'}</g:availability>`,
    `      <g:price>${escapeXml(regularPrice)}</g:price>`,
    ...(salePrice ? [`      <g:sale_price>${escapeXml(salePrice)}</g:sale_price>`] : []),
    '      <g:condition>new</g:condition>',
    `      <g:brand>${escapeXml(product.vendor || BRAND)}</g:brand>`,
    `      <g:mpn>${escapeXml(variant.sku ?? product.handle)}</g:mpn>`,
    //  Fine jewelry made and sold under our own name carries no
    //  manufacturer barcode. Declaring that explicitly is what stops the
    //  "missing GTIN" disapproval; brand + mpn still go out so Google can
    //  match the item. Flip to `yes` only if these ever get real GTINs.
    '      <g:identifier_exists>no</g:identifier_exists>',
    `      <g:google_product_category>${escapeXml(category)}</g:google_product_category>`,
    ...(product.productType
      ? [`      <g:product_type>${escapeXml(product.productType)}</g:product_type>`]
      : []),
    //  Free insured domestic shipping, matching /shipping and the
    //  Product JSON-LD on the product page. Feed and landing page must
    //  agree or Google flags a mismatch.
    '      <g:shipping>',
    '        <g:country>US</g:country>',
    `        <g:price>${escapeXml(formatPrice('0', current.currencyCode))}</g:price>`,
    '      </g:shipping>',
    ...(isFinalSale(product)
      ? [`      <g:return_policy_label>${escapeXml(FINAL_SALE_LABEL)}</g:return_policy_label>`]
      : []),
    '    </item>',
  ]

  return lines.join('\n')
}

export async function GET() {
  let products: ShopifyProduct[]
  try {
    products = await listAllProducts()
  } catch (err) {
    console.error('[google-feed] catalog fetch failed', err)
    // Fail loudly. An empty or partial feed reads to Google as "these
    // items are gone" and delists the catalog; a 503 makes it retry and
    // keep the last good fetch.
    return new Response('Product feed temporarily unavailable.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  if (products.length === 0) {
    console.error('[google-feed] catalog returned zero products')
    return new Response('Product feed temporarily unavailable.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const items = products
    .map(itemXml)
    .filter((item): item is string => item !== null)

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${escapeXml(BRAND)}</title>`,
    `    <link>${escapeXml(SITE_URL)}</link>`,
    '    <description>Fine jewelry from HV Jewelers.</description>',
    ...items,
    '  </channel>',
    '</rss>',
  ].join('\n')

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
