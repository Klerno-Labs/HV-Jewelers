import { z } from 'zod'
import { cuidSchema, safeName, safeShortText, slugSchema } from './common'

export const editorialStatus = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export const editorialPostInput = z.object({
  slug: slugSchema,
  title: safeName,
  excerpt: safeShortText.optional().nullable(),
  /// MDX/Markdown body. Render through a sanitizer; never feed to
  /// dangerouslySetInnerHTML directly.
  body: z.string().min(1).max(50_000),
  heroImagePublicId: z.string().trim().max(256).optional().nullable(),
  heroImageUrl: z.string().url().max(2048).optional().nullable(),
  status: editorialStatus.default('DRAFT'),
  publishedAt: z.coerce.date().optional().nullable(),
  metaTitle: safeShortText.optional().nullable(),
  metaDescription: safeShortText.optional().nullable(),
})
export type EditorialPostInput = z.infer<typeof editorialPostInput>

export const editorialPostUpdateInput = editorialPostInput.partial().extend({
  id: cuidSchema,
})
export type EditorialPostUpdateInput = z.infer<typeof editorialPostUpdateInput>

// ─── Homepage section configurations ─────────────────────────────────────

export const homepageSectionType = z.enum([
  'HERO',
  'EDITORIAL_HIGHLIGHT',
  'FEATURED_COLLECTION',
  'NEW_ARRIVALS_GRID',
  'TWO_UP',
  'PRESS_QUOTE',
  'CTA_BAND',
])
export type HomepageSectionType = z.infer<typeof homepageSectionType>

const linkSchema = z.object({
  label: safeName,
  href: z.string().min(1).max(512),
})

const imageRefSchema = z.object({
  cloudinaryPublicId: z.string().trim().max(256),
  url: z.string().url().max(2048),
  alt: safeShortText.optional().nullable(),
})

const heroData = z.object({
  eyebrow: safeShortText.optional().nullable(),
  headline: z.string().min(1).max(280),
  body: z.string().max(800).optional().nullable(),
  primaryCta: linkSchema.optional().nullable(),
  secondaryCta: linkSchema.optional().nullable(),
  image: imageRefSchema.optional().nullable(),
})

const editorialHighlightData = z.object({
  postSlug: slugSchema,
  imageOverride: imageRefSchema.optional().nullable(),
})

const featuredCollectionData = z.object({
  collectionSlug: slugSchema,
  showCount: z.number().int().min(1).max(12).default(4),
})

const newArrivalsGridData = z.object({
  count: z.number().int().min(2).max(12).default(6),
})

const twoUpData = z.object({
  left: z.object({
    eyebrow: safeShortText.optional().nullable(),
    headline: safeName,
    body: z.string().max(600).optional().nullable(),
    cta: linkSchema.optional().nullable(),
    image: imageRefSchema.optional().nullable(),
  }),
  right: z.object({
    eyebrow: safeShortText.optional().nullable(),
    headline: safeName,
    body: z.string().max(600).optional().nullable(),
    cta: linkSchema.optional().nullable(),
    image: imageRefSchema.optional().nullable(),
  }),
})

const pressQuoteData = z.object({
  quote: z.string().min(1).max(600),
  attribution: safeShortText,
})

const ctaBandData = z.object({
  headline: safeName,
  body: z.string().max(400).optional().nullable(),
  cta: linkSchema,
})

/**
 * Discriminated section schema. Use this when reading or writing a
 * homepage section to ensure the `data` blob matches the section type.
 */
export const homepageSectionInput = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HERO'), title: safeName.optional().nullable(), subtitle: safeShortText.optional().nullable(), position: z.number().int().min(0), isPublished: z.boolean().default(false), data: heroData }),
  z.object({ type: z.literal('EDITORIAL_HIGHLIGHT'), title: safeName.optional().nullable(), subtitle: safeShortText.optional().nullable(), position: z.number().int().min(0), isPublished: z.boolean().default(false), data: editorialHighlightData }),
  z.object({ type: z.literal('FEATURED_COLLECTION'), title: safeName.optional().nullable(), subtitle: safeShortText.optional().nullable(), position: z.number().int().min(0), isPublished: z.boolean().default(false), data: featuredCollectionData }),
  z.object({ type: z.literal('NEW_ARRIVALS_GRID'), title: safeName.optional().nullable(), subtitle: safeShortText.optional().nullable(), position: z.number().int().min(0), isPublished: z.boolean().default(false), data: newArrivalsGridData }),
  z.object({ type: z.literal('TWO_UP'), title: safeName.optional().nullable(), subtitle: safeShortText.optional().nullable(), position: z.number().int().min(0), isPublished: z.boolean().default(false), data: twoUpData }),
  z.object({ type: z.literal('PRESS_QUOTE'), title: safeName.optional().nullable(), subtitle: safeShortText.optional().nullable(), position: z.number().int().min(0), isPublished: z.boolean().default(false), data: pressQuoteData }),
  z.object({ type: z.literal('CTA_BAND'), title: safeName.optional().nullable(), subtitle: safeShortText.optional().nullable(), position: z.number().int().min(0), isPublished: z.boolean().default(false), data: ctaBandData }),
])
export type HomepageSectionInput = z.infer<typeof homepageSectionInput>
