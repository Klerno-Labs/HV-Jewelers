import { serverEnv } from '@/lib/env'

/**
 * Minimal Shippo integration using `fetch`. We avoid pulling in the
 * Shippo SDK so we can pin behavior exactly and keep the bundle small.
 *
 * Env-gated: when SHIPPO_API_KEY is unset, `isShippoConfigured()`
 * returns false and `createLabelForOrder` throws a clear error. The
 * admin UI falls back to manual tracking entry when this happens.
 *
 * Scope at launch:
 *   • Domestic US only.
 *   • Single default parcel (small jewelry box, under a pound).
 *   • Rate-shop across carriers, pick the lowest USPS/UPS/FedEx rate
 *     unless a specific carrier is requested.
 *   • Signature required on delivery (we carry the policy here, not
 *     just on the order).
 */

const SHIPPO_BASE = 'https://api.goshippo.com'

const DEFAULT_PARCEL = {
  length: '6',
  width: '4',
  height: '2',
  distance_unit: 'in' as const,
  weight: '0.6',
  mass_unit: 'lb' as const,
}

const PREFERRED_CARRIERS = ['USPS', 'UPS', 'FedEx']

export interface LabelResult {
  transactionId: string
  trackingNumber: string
  carrier: string
  labelUrl: string
  trackingUrl: string | null
  rateAmountCents: number
  currency: string
}

export function isShippoConfigured(): boolean {
  return Boolean(
    serverEnv.SHIPPO_API_KEY &&
      serverEnv.SELLER_SHIP_FROM_NAME &&
      serverEnv.SELLER_SHIP_FROM_STREET1 &&
      serverEnv.SELLER_SHIP_FROM_CITY &&
      serverEnv.SELLER_SHIP_FROM_STATE &&
      serverEnv.SELLER_SHIP_FROM_POSTAL,
  )
}

function headers(): HeadersInit {
  return {
    Authorization: `ShippoToken ${serverEnv.SHIPPO_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function post(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${SHIPPO_BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Shippo ${path} failed: ${res.status} ${res.statusText} ${text.slice(0, 200)}`,
    )
  }
  return res.json()
}

export interface ShipToAddress {
  name: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip: string
  country: string
  phone?: string | null
  email?: string | null
}

/**
 * Create a shipment, pick the cheapest preferred rate, purchase the
 * label, and return the tracking + URL fields we persist on the Order.
 */
export async function createLabel(args: {
  shipTo: ShipToAddress
  signatureRequired: boolean
}): Promise<LabelResult> {
  if (!isShippoConfigured()) {
    throw new Error('Shippo is not configured. Set SHIPPO_API_KEY + SELLER_SHIP_FROM_* env vars.')
  }

  const from = {
    name: serverEnv.SELLER_SHIP_FROM_NAME!,
    street1: serverEnv.SELLER_SHIP_FROM_STREET1!,
    city: serverEnv.SELLER_SHIP_FROM_CITY!,
    state: serverEnv.SELLER_SHIP_FROM_STATE!,
    zip: serverEnv.SELLER_SHIP_FROM_POSTAL!,
    country: 'US',
    phone: serverEnv.SELLER_SHIP_FROM_PHONE,
  }

  const to = {
    name: args.shipTo.name,
    street1: args.shipTo.street1,
    street2: args.shipTo.street2 ?? undefined,
    city: args.shipTo.city,
    state: args.shipTo.state,
    zip: args.shipTo.zip,
    country: args.shipTo.country || 'US',
    phone: args.shipTo.phone ?? undefined,
    email: args.shipTo.email ?? undefined,
  }

  const shipment = (await post('/shipments/', {
    address_from: from,
    address_to: to,
    parcels: [DEFAULT_PARCEL],
    async: false,
    extra: {
      signature_confirmation: args.signatureRequired ? 'STANDARD' : undefined,
      insurance: { amount: '500', currency: 'USD', provider: 'FEDEX' },
    },
  })) as { object_id: string; rates: ShippoRate[] }

  const chosen = pickRate(shipment.rates)
  if (!chosen) {
    throw new Error('No eligible Shippo rates returned for this shipment.')
  }

  const txn = (await post('/transactions/', {
    rate: chosen.object_id,
    label_file_type: 'PDF',
    async: false,
  })) as ShippoTransaction

  if (txn.status !== 'SUCCESS' || !txn.label_url) {
    const messages = (txn.messages ?? [])
      .map((m) => m.text)
      .join('; ')
    throw new Error(`Shippo transaction failed: ${messages || txn.status}`)
  }

  return {
    transactionId: txn.object_id,
    trackingNumber: txn.tracking_number,
    carrier: chosen.provider.toUpperCase(),
    labelUrl: txn.label_url,
    trackingUrl: txn.tracking_url_provider ?? null,
    rateAmountCents: Math.round(Number(chosen.amount) * 100),
    currency: chosen.currency.toUpperCase(),
  }
}

interface ShippoRate {
  object_id: string
  provider: string
  servicelevel: { name: string; token: string }
  amount: string
  currency: string
  estimated_days?: number
}

interface ShippoTransaction {
  object_id: string
  status: string
  label_url?: string
  tracking_number: string
  tracking_url_provider?: string
  messages?: Array<{ text: string; code?: string }>
}

function pickRate(rates: ShippoRate[]): ShippoRate | null {
  if (rates.length === 0) return null
  const preferred = rates.filter((r) =>
    PREFERRED_CARRIERS.some(
      (p) => p.toLowerCase() === r.provider.toLowerCase(),
    ),
  )
  const pool = preferred.length > 0 ? preferred : rates
  return pool
    .slice()
    .sort((a, b) => Number(a.amount) - Number(b.amount))[0] ?? null
}

/**
 * Maps a shipping country + state into the snapshot shape our Order
 * rows carry. Shippo expects 2-letter US state codes; Stripe returns
 * the same.
 */
export function shipToFromOrder(order: {
  shipName: string
  shipLine1: string
  shipLine2: string | null
  shipCity: string
  shipRegion: string
  shipPostalCode: string
  shipCountry: string
  shipPhone: string | null
  email: string | null
}): ShipToAddress {
  return {
    name: order.shipName,
    street1: order.shipLine1,
    street2: order.shipLine2,
    city: order.shipCity,
    state: order.shipRegion,
    zip: order.shipPostalCode,
    country: order.shipCountry || 'US',
    phone: order.shipPhone,
    email: order.email,
  }
}
