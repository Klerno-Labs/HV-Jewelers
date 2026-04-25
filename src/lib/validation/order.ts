import { z } from 'zod'
import { addressInput } from './address'
import { cents, cuidSchema, currencySchema, safeText } from './common'

/**
 * Order intent — what the storefront sends to start checkout. The full
 * Order is constructed server-side from cart contents + price snapshots;
 * the client never sets totals or line prices directly.
 */

export const checkoutIntentInput = z.object({
  cartId: cuidSchema,
  email: z.string().trim().toLowerCase().email().max(254),
  shipping: addressInput,
  customerNote: safeText.optional().nullable(),
  acceptsTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms before checking out.' }),
  }),
})
export type CheckoutIntentInput = z.infer<typeof checkoutIntentInput>

/**
 * Admin order updates — limited set of fields that staff can edit
 * directly. Money totals never appear here; refunds go through a
 * dedicated refund flow that hits Stripe.
 */
export const orderAdminUpdateInput = z.object({
  id: cuidSchema,
  internalNote: safeText.optional().nullable(),
  carrier: z.string().trim().max(40).optional().nullable(),
  trackingNumber: z.string().trim().max(80).optional().nullable(),
  signatureRequired: z.boolean().optional(),
})
export type OrderAdminUpdateInput = z.infer<typeof orderAdminUpdateInput>

/**
 * Refund intent — admin-initiated. Amount in cents. The route handler
 * will additionally enforce that the amount does not exceed the
 * order's remaining refundable amount.
 */
export const refundIntentInput = z.object({
  orderId: cuidSchema,
  amountCents: cents.refine((v) => v > 0, 'Amount must be greater than zero.'),
  reason: z.enum(['DEFECTIVE', 'NOT_AS_DESCRIBED', 'NOT_RECEIVED', 'OTHER']),
  notes: safeText.optional().nullable(),
  currency: currencySchema.default('USD'),
})
export type RefundIntentInput = z.infer<typeof refundIntentInput>
