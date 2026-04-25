import { z } from 'zod'

/**
 * Shared building blocks for input validation. All admin/user inputs at
 * the server boundary should be parsed through one of these or a schema
 * derived from them — never trust raw request bodies.
 */

export const slugSchema = z
  .string()
  .min(1)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, hyphen-separated, no leading/trailing hyphens.',
  })

export const cuidSchema = z.string().min(1).max(64)

export const cents = z.number().int().min(0).max(100_000_000) // up to $1,000,000

export const positiveCents = cents.refine((v) => v > 0, {
  message: 'Must be greater than zero.',
})

export const isoCountrySchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'Use ISO 3166-1 alpha-2 code (e.g., "US").')

export const currencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Use ISO 4217 currency code (e.g., "USD").')

export const safeText = z.string().trim().max(2000)
export const safeShortText = z.string().trim().max(280)
export const safeName = z.string().trim().min(1).max(140)
