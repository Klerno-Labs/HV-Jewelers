/**
 * Shopify Storefront API response types. Only the fields we actually
 * use in the UI are typed; unused fields on the GraphQL responses are
 * silently dropped at the connection-edge mapper.
 */

export interface Money {
  amount: string
  currencyCode: string
}

export interface ImageEdge {
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export interface ProductOption {
  name: string
  values: string[]
}

export interface SelectedOption {
  name: string
  value: string
}

export interface ProductVariant {
  id: string
  title: string
  sku: string | null
  availableForSale: boolean
  price: Money
  compareAtPrice: Money | null
  selectedOptions: SelectedOption[]
  image: ImageEdge | null
}

export interface PriceRange {
  minVariantPrice: Money
  maxVariantPrice: Money
}

export interface ProductMediaImage {
  mediaType: 'image'
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export interface ProductMediaVideo {
  mediaType: 'video'
  altText: string | null
  /// Shopify-hosted video renditions (mp4/webm). The UI picks the best
  /// playable source; ordered as Shopify returns them.
  sources: Array<{ url: string; mimeType: string; width: number | null; height: number | null }>
  previewImage: ImageEdge | null
}

/// Normalized product media. Shopify also exposes ExternalVideo + Model3d;
/// those are intentionally dropped at the mapper until we need them.
export type ProductMedia = ProductMediaImage | ProductMediaVideo

export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  vendor: string
  productType: string
  tags: string[]
  availableForSale: boolean
  totalInventory: number | null
  priceRange: PriceRange
  compareAtPriceRange: PriceRange | null
  featuredImage: ImageEdge | null
  images: ImageEdge[]
  /// Ordered media (images + videos) as arranged in Shopify. Drives the
  /// product gallery; `images` is kept for cards, OG tags, and fallbacks.
  media: ProductMedia[]
  options: ProductOption[]
  variants: ProductVariant[]
  updatedAt: string
}

export interface CartLineCost {
  totalAmount: Money
  subtotalAmount: Money
  amountPerQuantity: Money
}

export interface CartLine {
  id: string
  quantity: number
  cost: CartLineCost
  merchandise: {
    id: string
    title: string
    sku: string | null
    image: ImageEdge | null
    product: {
      handle: string
      title: string
    }
    selectedOptions: SelectedOption[]
  }
}

export interface CartCost {
  totalAmount: Money
  subtotalAmount: Money
  totalTaxAmount: Money | null
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: CartCost
  lines: CartLine[]
  createdAt: string
  updatedAt: string
}

export interface UserError {
  field: string[] | null
  message: string
  code: string | null
}

export interface CartMutationResult {
  cart: ShopifyCart | null
  userErrors: UserError[]
}
