import { z } from 'zod'
import {
  cents,
  cuidSchema,
  currencySchema,
  positiveCents,
  safeName,
  safeShortText,
  safeText,
  slugSchema,
} from './common'

/**
 * Server-side validation for product create/update. The admin form maps
 * onto these schemas; never write directly from a request body.
 *
 * Note: Prisma enums are strings at the wire. Mirror them as z.enum so
 * the input is rejected before it reaches the DB.
 */

export const productEra = z.enum(['VINTAGE_ERA', 'NEAR_VINTAGE', 'MODERN_FINE', 'JADE'])
export const productStatus = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
export const productCondition = z.enum([
  'NEW',
  'NEW_OLD_STOCK',
  'EXCELLENT',
  'VERY_GOOD',
  'GOOD',
  'FAIR',
])
export const goldKarat = z.enum(['NONE', 'K8', 'K9', 'K10', 'K14', 'K18', 'K22', 'K24'])
export const stockMode = z.enum(['ONE_OF_ONE', 'LIMITED_STOCK', 'MADE_TO_ORDER', 'REORDERABLE'])

export const materialKind = z.enum([
  'GOLD_YELLOW',
  'GOLD_WHITE',
  'GOLD_ROSE',
  'GOLD_GREEN',
  'PLATINUM',
  'STERLING_SILVER',
  'PALLADIUM',
  'STAINLESS_STEEL',
  'TITANIUM',
  'COPPER',
  'BRASS',
  'OTHER',
])

export const stoneKind = z.enum([
  'DIAMOND',
  'SAPPHIRE',
  'RUBY',
  'EMERALD',
  'JADE',
  'PEARL',
  'OPAL',
  'TURQUOISE',
  'AMETHYST',
  'TOPAZ',
  'CITRINE',
  'GARNET',
  'ONYX',
  'CORAL',
  'LAPIS',
  'OTHER',
])

export const productImageInput = z.object({
  cloudinaryPublicId: z.string().min(1).max(256),
  url: z.string().url().max(2048),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: safeShortText.optional(),
  caption: safeShortText.optional(),
  position: z.number().int().min(0).default(0),
  isHero: z.boolean().default(false),
})

export const productMaterialInput = z.object({
  kind: materialKind,
  notes: safeShortText.optional(),
})

export const productStoneInput = z.object({
  kind: stoneKind,
  caratWeight: z.number().nonnegative().max(10_000).optional(),
  count: z.number().int().nonnegative().max(10_000).optional(),
  notes: safeShortText.optional(),
})

const baseProduct = {
  slug: slugSchema,
  title: safeName,
  shortDescription: safeShortText.optional().nullable(),
  longDescription: safeText.optional().nullable(),
  era: productEra,
  status: productStatus.default('DRAFT'),
  isHidden: z.boolean().default(false),

  priceCents: positiveCents,
  compareAtCents: cents.optional().nullable(),
  currency: currencySchema.default('USD'),

  materialsText: safeText.optional().nullable(),
  stonesText: safeText.optional().nullable(),
  dimensionsText: safeShortText.optional().nullable(),

  goldKarat: goldKarat.default('NONE'),
  gramWeight: z.number().nonnegative().max(10_000).optional().nullable(),
  gramWeightVisible: z.boolean().default(false),

  ringSize: z.string().trim().max(16).optional().nullable(),
  isResizable: z.boolean().default(false),
  resizeNotes: safeShortText.optional().nullable(),
  resizeVoidsReturn: z.boolean().default(true),

  stockMode: stockMode.default('ONE_OF_ONE'),
  isReorderable: z.boolean().default(false),
  isFinalSale: z.boolean().default(true),
  returnWindowDays: z.number().int().min(0).max(365).default(0),

  signed: z.boolean().default(false),
  signedNotes: safeShortText.optional().nullable(),
  provenance: safeText.optional().nullable(),
  condition: productCondition.default('EXCELLENT'),
  conditionNotes: safeText.optional().nullable(),

  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),

  shippingProfileId: cuidSchema.optional().nullable(),

  metaTitle: safeShortText.optional().nullable(),
  metaDescription: safeShortText.optional().nullable(),

  collectionIds: z.array(cuidSchema).max(20).default([]),
  images: z.array(productImageInput).max(20).default([]),
  materials: z.array(productMaterialInput).max(10).default([]),
  stones: z.array(productStoneInput).max(10).default([]),
}

export const productCreateInput = z
  .object(baseProduct)
  .superRefine((value, ctx) => {
    if (
      value.compareAtCents != null &&
      value.compareAtCents > 0 &&
      value.compareAtCents <= value.priceCents
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['compareAtCents'],
        message: 'Compare-at price must be greater than the price.',
      })
    }
    if (value.isFinalSale && value.returnWindowDays > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['returnWindowDays'],
        message: 'Final-sale items must have a 0-day return window.',
      })
    }
  })

export const productUpdateInput = z
  .object({ id: cuidSchema, ...baseProduct })
  .partial({ collectionIds: true, images: true, materials: true, stones: true })

export type ProductCreateInput = z.infer<typeof productCreateInput>
export type ProductUpdateInput = z.infer<typeof productUpdateInput>
