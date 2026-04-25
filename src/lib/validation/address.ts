import { z } from 'zod'
import { isoCountrySchema, safeName } from './common'

/**
 * Shipping address. Domestic-only at launch — accepts non-US country
 * codes for future expansion but the storefront will reject anything
 * outside the supported list at the application layer.
 */

export const addressInput = z.object({
  fullName: safeName,
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postalCode: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9 \-]+$/, 'Postal code may only contain letters, digits, spaces, and hyphens.'),
  country: isoCountrySchema,
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+0-9()\-.\s]*$/, 'Phone may only contain digits, spaces, and the characters + ( ) - .')
    .optional()
    .nullable(),
  isDefault: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof addressInput>

/// Domestic launch — restrict storefront submissions to this list.
export const SUPPORTED_SHIPPING_COUNTRIES: readonly string[] = ['US']

export function isSupportedShippingCountry(country: string): boolean {
  return SUPPORTED_SHIPPING_COUNTRIES.includes(country.toUpperCase())
}
