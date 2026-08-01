import { z } from 'zod'

export const CLIENT_EVENT_TYPES = [
  'site_visit',
  'product_view',
  'gallery_engaged',
  'filter_used',
  'add_to_cart',
  'cart_opened',
  'newsletter_signup',
  'concierge_inquiry',
  'experiment_exposure',
] as const

const attributionToken = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9._/-]*$/, 'Must be a non-identifying campaign token')

const shopifyProductId = z
  .string()
  .trim()
  .max(96)
  .regex(
    /^(?:gid:\/\/shopify\/Product\/[A-Za-z0-9_-]+|\d+)$/,
    'Must be a Shopify product identifier',
  )

const shopifyVariantId = z
  .string()
  .trim()
  .max(96)
  .regex(
    /^(?:gid:\/\/shopify\/ProductVariant\/[A-Za-z0-9_-]+|\d+)$/,
    'Must be a Shopify product variant identifier',
  )

export const clientSalesEventSchema = z
  .object({
    eventType: z.enum(CLIENT_EVENT_TYPES),
    sessionId: z.string().uuid(),
    productId: shopifyProductId.optional(),
    variantId: shopifyVariantId.optional(),
    source: attributionToken.default('direct'),
    medium: attributionToken.default('none'),
    campaign: attributionToken.default('none'),
    experimentId: attributionToken.optional(),
    experimentVariant: attributionToken.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ['product_view', 'gallery_engaged', 'add_to_cart'].includes(value.eventType) &&
      !value.productId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productId'],
        message: `${value.eventType} requires productId`,
      })
    }
    if (
      value.eventType === 'experiment_exposure' &&
      (!value.experimentId || !value.experimentVariant)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['experimentId'],
        message: 'experiment_exposure requires experimentId and experimentVariant',
      })
    }
  })

const orderLineSchema = z
  .object({
    product_id: z.union([z.string(), z.number()]).nullable().optional(),
    variant_id: z.union([z.string(), z.number()]).nullable().optional(),
    quantity: z.number().int().positive().default(1),
    price: z.union([z.string(), z.number()]).default(0),
  })
  .strip()

export const paidOrderSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    cart_token: z.string().nullable().optional(),
    current_total_price: z.union([z.string(), z.number()]).optional(),
    total_price: z.union([z.string(), z.number()]).optional(),
    currency: z.string().regex(/^[A-Za-z]{3}$/),
    line_items: z.array(orderLineSchema).default([]),
  })
  .strip()

export type ClientSalesEvent = z.infer<typeof clientSalesEventSchema>
export type SafePaidOrder = z.infer<typeof paidOrderSchema>

export function storefrontCartToken(cartId: string): string {
  const withoutQuery = cartId.split('?')[0] ?? cartId
  const token = withoutQuery.split('/').filter(Boolean).at(-1)
  return token || withoutQuery
}

export function safeMoney(value: string | number | undefined): number {
  const amount = typeof value === 'number' ? value : Number.parseFloat(value ?? '0')
  if (!Number.isFinite(amount) || amount < 0) return 0
  return Math.round(amount * 100) / 100
}

export function normalizeAttributionToken(value: string | null): string {
  if (!value || value.includes('@')) return ''
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return attributionToken.safeParse(normalized).success ? normalized : ''
}
