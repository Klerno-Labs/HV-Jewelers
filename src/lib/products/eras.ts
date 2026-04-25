import type {
  GoldKarat,
  ProductCondition,
  ProductEra,
  ProductStatus,
  StockMode,
} from '@prisma/client'

/**
 * Display-name maps and policy defaults for catalog enums. The defaults
 * here only inform a freshly created Product — every product is then
 * admin-controlled and can deviate. Once a Product is purchased, the
 * effective policy is snapshotted onto the OrderLine and never re-derived.
 */

export const ERA_LABELS: Record<ProductEra, string> = {
  VINTAGE_ERA: 'Vintage Era',
  NEAR_VINTAGE: 'Near Vintage',
  MODERN_FINE: 'Modern Fine Jewelry',
  JADE: 'Jade',
}

export const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
}

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  NEW: 'New',
  NEW_OLD_STOCK: 'Older — never worn',
  EXCELLENT: 'Excellent',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
}

export const GOLD_KARAT_LABELS: Record<GoldKarat, string> = {
  NONE: '—',
  K8: '8K',
  K9: '9K',
  K10: '10K',
  K14: '14K',
  K18: '18K',
  K22: '22K',
  K24: '24K',
}

export const STOCK_MODE_LABELS: Record<StockMode, string> = {
  ONE_OF_ONE: 'One of one',
  LIMITED_STOCK: 'Limited stock',
  MADE_TO_ORDER: 'Made to order',
  REORDERABLE: 'Reorderable',
}

/**
 * Default return policy by era. Vintage/Near-Vintage/Jade default to final
 * sale; Modern Fine pieces default to a 15-day window. Admin can override
 * per product before publishing.
 */
export interface EraPolicyDefaults {
  isFinalSale: boolean
  returnWindowDays: number
  isReorderable: boolean
  defaultStockMode: StockMode
}

export const ERA_POLICY_DEFAULTS: Record<ProductEra, EraPolicyDefaults> = {
  VINTAGE_ERA: {
    isFinalSale: true,
    returnWindowDays: 0,
    isReorderable: false,
    defaultStockMode: 'ONE_OF_ONE',
  },
  NEAR_VINTAGE: {
    isFinalSale: true,
    returnWindowDays: 0,
    isReorderable: false,
    defaultStockMode: 'ONE_OF_ONE',
  },
  MODERN_FINE: {
    isFinalSale: false,
    returnWindowDays: 15,
    isReorderable: false,
    defaultStockMode: 'ONE_OF_ONE',
  },
  JADE: {
    isFinalSale: true,
    returnWindowDays: 0,
    isReorderable: false,
    defaultStockMode: 'ONE_OF_ONE',
  },
}

export function eraDefaults(era: ProductEra): EraPolicyDefaults {
  return ERA_POLICY_DEFAULTS[era]
}
