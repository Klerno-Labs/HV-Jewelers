import { z } from 'zod'
import { cents, cuidSchema, safeName, safeShortText, safeText } from './common'

export const signatureRequirement = z.enum(['NONE', 'STANDARD', 'ADULT'])

export const shippingProfileInput = z.object({
  name: safeName,
  description: safeShortText.optional().nullable(),
  baseRateCents: cents.default(0),
  isDefault: z.boolean().default(false),
  signature: signatureRequirement.default('STANDARD'),
  insuranceLevel: safeShortText.optional().nullable(),
  carrierPreference: safeShortText.optional().nullable(),
  notes: safeText.optional().nullable(),
})
export type ShippingProfileInput = z.infer<typeof shippingProfileInput>

export const shippingProfileUpdateInput = shippingProfileInput.partial().extend({
  id: cuidSchema,
})
export type ShippingProfileUpdateInput = z.infer<typeof shippingProfileUpdateInput>
