/**
 * Currency formatting. Cents → display string. We avoid Intl.NumberFormat
 * with the currency locale-default because it inserts a space we don't
 * want in editorial layouts. The output is `$<n>` for whole-dollar
 * amounts (typical for our catalog) and `$<n>.<cc>` when cents are
 * non-zero.
 */
export function formatPrice(
  cents: number,
  currency: string = 'USD',
): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const remainder = abs % 100
  const symbol = currency === 'USD' ? '$' : `${currency} `
  const dollarsStr = dollars.toLocaleString('en-US')
  if (remainder === 0) return `${sign}${symbol}${dollarsStr}`
  return `${sign}${symbol}${dollarsStr}.${remainder.toString().padStart(2, '0')}`
}
