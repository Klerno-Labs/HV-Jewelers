import { z } from 'zod'
import { cuidSchema, safeName, safeShortText, safeText, slugSchema } from './common'

export const collectionKind = z.enum([
  'ARCHIVE_VINTAGE',
  'NEAR_VINTAGE',
  'FINE_JEWELRY',
  'JADE',
  'GOLD',
  'PEARLS',
  'NEW_ARRIVALS',
  'CURATED',
])

export const collectionInput = z.object({
  slug: slugSchema,
  title: safeName,
  kind: collectionKind,
  description: safeText.optional().nullable(),
  heroImagePublicId: z.string().trim().max(256).optional().nullable(),
  heroImageUrl: z.string().url().max(2048).optional().nullable(),
  position: z.number().int().min(0).max(10_000).default(0),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  metaTitle: safeShortText.optional().nullable(),
  metaDescription: safeShortText.optional().nullable(),
})
export type CollectionInput = z.infer<typeof collectionInput>

export const collectionUpdateInput = collectionInput.partial().extend({
  id: cuidSchema,
})
export type CollectionUpdateInput = z.infer<typeof collectionUpdateInput>
