/**
 * Shopify `productType` → Google product taxonomy.
 *
 * Full category paths rather than numeric IDs: Google accepts either, and the
 * text form survives taxonomy renumbering and reads correctly in a diff. Every
 * type currently in the catalog is mapped; anything new falls back to the
 * parent Jewelry node rather than going out uncategorized.
 *
 * Shared deliberately. The Merchant Center feed and the product page's
 * structured data describe the same piece to the same crawler, so they read
 * the category from one table instead of two that can drift apart — the same
 * rule the return-policy classification already follows.
 */
const GOOGLE_CATEGORY: Record<string, string> = {
  Necklaces: 'Apparel & Accessories > Jewelry > Necklaces',
  Pendants: 'Apparel & Accessories > Jewelry > Charms & Pendants',
  Earrings: 'Apparel & Accessories > Jewelry > Earrings',
  Rings: 'Apparel & Accessories > Jewelry > Rings',
  Bracelets: 'Apparel & Accessories > Jewelry > Bracelets',
}

export const FALLBACK_CATEGORY = 'Apparel & Accessories > Jewelry'

export function googleCategoryFor(productType: string | null | undefined): string {
  return GOOGLE_CATEGORY[(productType ?? '').trim()] ?? FALLBACK_CATEGORY
}
