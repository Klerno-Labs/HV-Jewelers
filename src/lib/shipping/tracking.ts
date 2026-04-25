/**
 * Carrier tracking URL builder. Returns a canonical tracking page so the
 * customer-facing shipped email can include a live link. We never embed
 * tracking numbers into query strings that look like customer PII.
 *
 * Carriers list matches the admin ship-form select options.
 */

export type SupportedCarrier = 'UPS' | 'FEDEX' | 'USPS' | 'DHL' | 'OTHER'

export function buildTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!carrier || !trackingNumber) return null
  const tn = trackingNumber.trim()
  if (!tn) return null

  switch (carrier.toUpperCase()) {
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${encodeURIComponent(tn)}`
    case 'FEDEX':
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tn)}`
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tn)}`
    case 'DHL':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(tn)}`
    case 'OTHER':
    default:
      return null
  }
}
