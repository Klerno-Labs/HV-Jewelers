import type { Money } from './types'

/**
 * Money helpers. Shopify returns prices as decimal strings; the
 * existing UI components use integer cents. These bridges keep the
 * conversion in one place.
 */

export function moneyToCents(money: Money | null | undefined): number {
  if (!money) return 0
  const n = parseFloat(money.amount)
  if (Number.isNaN(n)) return 0
  return Math.round(n * 100)
}

export function formatMoney(money: Money | null | undefined): string {
  if (!money) return ''
  const n = parseFloat(money.amount)
  if (Number.isNaN(n)) return ''
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currencyCode,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${money.currencyCode} ${money.amount}`
  }
}
