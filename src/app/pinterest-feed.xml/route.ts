import { listAllProducts } from '@/lib/shopify/products'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Pinterest retail catalog data source (RSS 2.0 + the `g:` namespace).
 *
 * Why this exists rather than the Shopify Pinterest sales channel: that
 * channel reports the store's Shopify primary domain as the website and
 * re-claims it on every sync. Here the primary domain is
 * `zvf91s-qy.myshopify.com`, which serves nothing — the storefront is
 * headless and lives on this Vercel app. Pinterest reviewed that empty
 * address and suspended the merchant for an "incomplete website" with
 * "no returns policy", both of which were true of what it was shown.
 * The channel has no headless mode and Shopify's primary domain cannot
 * be pointed here, so the fix is to drop the channel and feed the
 * catalog by URL instead. Pinterest ingests a hosted data source daily
 * and never needed Shopify for it.
 *
 * Add this at https://hvjewelers.com/pinterest-feed.xml as a scheduled
 * data source under Catalogs, with hvjewelers.com claimed (DNS) as the
 * only claimed domain.
 *
 * Deliberately a sibling of google-feed.xml rather than a shared builder:
 * the two specs agree on most fields and disagree on several, and the
 * disagreements are silent failures rather than errors. Keeping them
 * apart means a change made for Google cannot quietly break Pinterest.
 * The differences that matter, all verified against Pinterest's
 * published field reference:
 *
 *   - `availability` is "in stock" / "out of stock" with SPACES.
 *     Google uses underscores. This one is the whole feed: a wrong value
 *     in a required field fails ingestion for the entire catalog, not
 *     just the item.
 *   - `shipping` is a colon-delimited string, country:region:service:price,
 *     with the colons required even when the parts are blank. Google uses
 *     a nested <g:shipping> element group.
 *   - There is no `identifier_exists` in Pinterest's spec. Google needs it
 *     to excuse missing GTINs; sending it here is just an unknown field.
 *   - `item_group_id` is required only for multi-variant products. Every
 *     piece here is one of one with a single variant, so it is omitted
 *     rather than sent pointing at itself.
 *   - `price` must never be 0.
 */

export const revalidate = 3600

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hvjewelers.com'
).replace(/\/$/, '')

const BRAND = 'HV Jewelers'

/**
 * Shopify `productType` → Google product taxonomy, which Pinterest also
 * accepts under `google_product_category`. Same mapping as the Google
 * feed on purpose: one piece classified two ways across two catalogs is
 * the kind of drift that is invisible until something is rejected.
 */
const GOOGLE_CATEGORY: Record<string, string> = {
  Necklaces: 'Apparel & Accessories > Jewelry > Necklaces',
  Pendants: 'Apparel & Accessories > Jewelry > Charms & Pendants',
  Earrings: 'Apparel & Accessories > Jewelry > Earrings',
  Rings: 'Apparel & Accessories > Jewelry > Rings',
  Bracelets: 'Apparel & Accessories > Jewelry > Bracelets',
}
const FALLBACK_CATEGORY = 'Apparel & Accessories > Jewelry'

/** Pinterest caps description at 10,000 characters, plain text. */
const DESCRIPTION_LIMIT = 10000

/**
 * Pinterest creates a SEPARATE PIN for every additional_image_link, all
 * pointing at the same product. For a catalog of one-of-a-kind pieces
 * that is upside — detail shots earn their own surface in the feed and
 * each still routes to the piece. Set to 0 to ship one pin per product
 * instead; the cap exists so that choice is one number, not a rewrite.
 */
const MAX_ADDITIONAL_IMAGES = 10

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** "1300.00 USD" — numeric plus ISO-4217, no symbols. */
function formatPrice(amount: string, currency: string): string {
  return `${Number(amount).toFixed(2)} ${currency}`
}

/**
 * Description is required and an item without one fails. Mirrors the
 * Google feed's fallback so a piece with no Shopify copy reads the same
 * on both platforms rather than being described two different ways.
 * Plain text only — Pinterest wants HTML in `description_html`, which we
 * do not send.
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

  // Both are required fields. Skipping a doomed item keeps the rest of
  // the catalog ingesting rather than risking the whole file.
  if (!variant || !image) return null

  const current = variant.price
  const compareAt = variant.compareAtPrice
  const onSale =
    compareAt != null && Number(compareAt.amount) > Number(current.amount)

  // Pinterest treats sale_price as the current price when present, so
  // price carries the was-price exactly as Google expects. Shopify models
  // it the other way round.
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
    `      <g:id>${escapeXml(variant.sku ?? product.handle)}</g:id>`,
    //  title / description / link stay unprefixed: they are core RSS 2.0
    //  elements, and that is how the Google feed next door emits them.
    //  Only fields outside the RSS spec take the g: namespace.
    `      <title>${escapeXml(product.title)}</title>`,
    `      <description>${escapeXml(feedDescription(product))}</description>`,
    `      <link>${escapeXml(`${SITE_URL}/shop/${product.handle}`)}</link>`,
    `      <g:image_link>${escapeXml(image.url)}</g:image_link>`,
    ...additionalImages.map(
      (url) =>
        `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
    ),
    //  Spaces, not underscores. See the header note — this is the field
    //  that silently takes down the whole catalog if it is wrong.
    `      <g:availability>${product.availableForSale ? 'in stock' : 'out of stock'}</g:availability>`,
    `      <g:price>${escapeXml(regularPrice)}</g:price>`,
    ...(salePrice
      ? [`      <g:sale_price>${escapeXml(salePrice)}</g:sale_price>`]
      : []),
    '      <g:condition>new</g:condition>',
    `      <g:brand>${escapeXml(product.vendor || BRAND)}</g:brand>`,
    `      <g:mpn>${escapeXml(variant.sku ?? product.handle)}</g:mpn>`,
    `      <g:google_product_category>${escapeXml(category)}</g:google_product_category>`,
    ...(product.productType
      ? [`      <g:product_type>${escapeXml(product.productType)}</g:product_type>`]
      : []),
    //  country:region:service:price, colons required even when blank.
    //  Free insured domestic shipping, matching /shipping, the Product
    //  JSON-LD, and the Google feed. Free shipping applies to everything
    //  in practice: the threshold is $70 and the cheapest piece is $750.
    `      <g:shipping>US:::${Number(0).toFixed(2)}</g:shipping>`,
    '      <g:free_shipping_label>true</g:free_shipping_label>',
    '      <g:free_shipping_limit>0</g:free_shipping_limit>',
    '    </item>',
  ]

  return lines.join('\n')
}

export async function GET() {
  let products: ShopifyProduct[]
  try {
    products = await listAllProducts()
  } catch (err) {
    console.error('[pinterest-feed] catalog fetch failed', err)
    // Same reasoning as the Google feed: an empty or partial file reads
    // as "these products are gone" and delists the catalog. A 503 makes
    // Pinterest retry and keep the last good ingestion.
    return new Response('Product feed temporarily unavailable.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  if (products.length === 0) {
    console.error('[pinterest-feed] catalog returned zero products')
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
      'Cache-Control':
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
