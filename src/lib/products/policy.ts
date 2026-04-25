import type { OrderLine, Product } from '@prisma/client'

/**
 * Return-policy logic.
 *
 * The cardinal rule: once a piece is purchased, the OrderLine carries its
 * own policy snapshot (`policyFinalSale`, `policyReturnWindowDays`, etc.).
 * Eligibility checks read from the snapshot — never from the live Product.
 * Otherwise an admin who flips a flag on a product later would silently
 * change what every past customer agreed to at purchase.
 */

export interface PolicySnapshot {
  policyFinalSale: boolean
  policyReturnWindowDays: number
  policyResizable: boolean
  policyResizeVoidsReturn: boolean
}

/**
 * Capture a Product's current policy at purchase time. The returned object
 * is what should be persisted on the OrderLine.
 */
export function snapshotPolicy(product: Pick<
  Product,
  'isFinalSale' | 'returnWindowDays' | 'isResizable' | 'resizeVoidsReturn'
>): PolicySnapshot {
  return {
    policyFinalSale: product.isFinalSale,
    policyReturnWindowDays: product.returnWindowDays,
    policyResizable: product.isResizable,
    policyResizeVoidsReturn: product.resizeVoidsReturn,
  }
}

export type EligibilityReason =
  | 'final_sale'
  | 'window_expired'
  | 'resized'
  | 'fulfillment_pending'
  | 'eligible'

export interface EligibilityResult {
  eligible: boolean
  reason: EligibilityReason
  /// When the return window closes for this line (null when not applicable).
  returnsCloseAt: Date | null
}

/**
 * Determine whether a single OrderLine is currently eligible for a
 * customer-initiated return. Damage / not-as-described is a separate
 * remedy path — this function only handles the standard return window.
 *
 * Rules:
 *   1. If the line was final-sale at purchase, never eligible.
 *   2. If the customer requested a resize and the policy says resizing
 *      voids returns, no longer eligible.
 *   3. If the order has not been delivered, not yet eligible (window
 *      starts at delivery — falls back to ship date when delivery is
 *      unknown, then to creation).
 *   4. Otherwise eligible until N days after the start date.
 */
export function isLineReturnEligible(
  line: Pick<
    OrderLine,
    | 'policyFinalSale'
    | 'policyReturnWindowDays'
    | 'policyResizable'
    | 'policyResizeVoidsReturn'
    | 'resizingRequested'
    | 'createdAt'
  >,
  fulfillment: { deliveredAt: Date | null; shippedAt: Date | null },
  asOf: Date = new Date(),
): EligibilityResult {
  if (line.policyFinalSale || line.policyReturnWindowDays <= 0) {
    return { eligible: false, reason: 'final_sale', returnsCloseAt: null }
  }

  if (line.resizingRequested && line.policyResizeVoidsReturn) {
    return { eligible: false, reason: 'resized', returnsCloseAt: null }
  }

  const startDate =
    fulfillment.deliveredAt ?? fulfillment.shippedAt ?? line.createdAt
  if (!fulfillment.deliveredAt && !fulfillment.shippedAt) {
    return { eligible: false, reason: 'fulfillment_pending', returnsCloseAt: null }
  }

  const closeAt = new Date(startDate)
  closeAt.setDate(closeAt.getDate() + line.policyReturnWindowDays)

  if (asOf > closeAt) {
    return { eligible: false, reason: 'window_expired', returnsCloseAt: closeAt }
  }

  return { eligible: true, reason: 'eligible', returnsCloseAt: closeAt }
}

/**
 * Customer-facing summary string. Keep brief; fuller copy lives in policy
 * pages. Used on the product page and at checkout.
 */
export function policyShortText(product: Pick<
  Product,
  'isFinalSale' | 'returnWindowDays' | 'isResizable'
>): string {
  if (product.isFinalSale || product.returnWindowDays <= 0) {
    return 'Final sale. No returns.'
  }
  const day = product.returnWindowDays === 1 ? 'day' : 'days'
  const resizeNote = product.isResizable
    ? ' Resizing available; resizing voids returns.'
    : ''
  return `${product.returnWindowDays}-${day} return on unworn pieces.${resizeNote}`
}
