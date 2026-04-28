import {
  PrismaClient,
  type Prisma,
  type ProductEra,
  type StockMode,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

/**
 * Development seed. Idempotent — uses upsert on unique fields so you can
 * run it repeatedly without piling on duplicates. Not for production data.
 *
 * Usage: `npx prisma db seed` (configured in package.json under "prisma").
 */

const prisma = new PrismaClient()

interface ProductSeed {
  slug: string
  title: string
  era: ProductEra
  shortDescription: string
  longDescription: string
  priceCents: number
  compareAtCents?: number
  goldKarat?: 'NONE' | 'K10' | 'K14' | 'K18' | 'K22' | 'K24'
  gramWeight?: number
  gramWeightVisible?: boolean
  ringSize?: string
  isResizable?: boolean
  resizeNotes?: string
  isFinalSale?: boolean
  returnWindowDays?: number
  isFeatured?: boolean
  isNewArrival?: boolean
  signed?: boolean
  signedNotes?: string
  condition: 'NEW' | 'NEW_OLD_STOCK' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR'
  conditionNotes?: string
  stockMode?: StockMode
  inventoryUnits?: number
  collections: string[]
  materials?: Array<{
    kind:
      | 'GOLD_YELLOW'
      | 'GOLD_WHITE'
      | 'GOLD_ROSE'
      | 'PLATINUM'
      | 'STERLING_SILVER'
      | 'OTHER'
    notes?: string
  }>
  stones?: Array<{
    kind:
      | 'DIAMOND'
      | 'SAPPHIRE'
      | 'RUBY'
      | 'EMERALD'
      | 'PEARL'
      | 'OTHER'
    caratWeight?: number
    count?: number
    notes?: string
  }>
}

const COLLECTIONS = [
  { slug: 'vintage-era', title: 'Vintage Era', kind: 'ARCHIVE_VINTAGE' as const },
  { slug: 'near-vintage', title: 'Near Vintage', kind: 'NEAR_VINTAGE' as const },
  { slug: 'modern-fine-jewelry', title: 'Modern Fine Jewelry', kind: 'FINE_JEWELRY' as const },
  { slug: 'gold', title: 'Gold', kind: 'GOLD' as const },
  { slug: 'pearls', title: 'Pearls', kind: 'PEARLS' as const },
  { slug: 'new-arrivals', title: 'New Arrivals', kind: 'NEW_ARRIVALS' as const },
]

const PRODUCTS: ProductSeed[] = [
  {
    slug: 'vintage-signet-1986',
    title: 'Engraved Signet, c. 1986',
    era: 'VINTAGE_ERA',
    shortDescription: 'A 14K signet from the mid-1980s. Made then, kept in store inventory since, never worn.',
    longDescription:
      'Hand-engraved into 14K yellow gold with clean, restrained geometry. Made in the mid-1980s and held in retail inventory ever since; the engraving is crisp and the shoulders are unworn. Sourced directly from a jewelry store that kept it in stock without ever ringing one up.',
    priceCents: 285000,
    goldKarat: 'K14',
    gramWeight: 11.4,
    gramWeightVisible: true,
    ringSize: '7.5',
    isResizable: true,
    resizeNotes: 'Resizable within 0.5 sizes; 7 to 10 days.',
    isFinalSale: true,
    returnWindowDays: 0,
    signed: false,
    condition: 'NEW_OLD_STOCK',
    conditionNotes: 'Older inventory, never sold or worn. Engraving crisp.',
    isFeatured: true,
    collections: ['vintage-era', 'gold'],
    materials: [{ kind: 'GOLD_YELLOW', notes: '14K' }],
  },
  {
    slug: 'modern-fine-solitaire-old-european',
    title: 'Old European Cut Solitaire, Modern Mount',
    era: 'MODERN_FINE',
    shortDescription: 'A 0.92ct old European cut diamond, set in a new 18K mount.',
    longDescription:
      'The diamond is an old European cut, hand-cut decades before lab-grade precision. We sourced it loose and set it new in 18K white gold. The piece itself is new and has not been worn.',
    priceCents: 685000,
    goldKarat: 'K18',
    gramWeight: 3.4,
    gramWeightVisible: false,
    ringSize: '6.25',
    isResizable: true,
    resizeNotes: 'Resizing available within ±1 size; voids the return window.',
    isFinalSale: false,
    returnWindowDays: 15,
    condition: 'EXCELLENT',
    isFeatured: true,
    collections: ['modern-fine-jewelry'],
    materials: [{ kind: 'GOLD_WHITE', notes: '18K' }],
    stones: [{ kind: 'DIAMOND', caratWeight: 0.92, count: 1, notes: 'Old European, F/SI1' }],
  },
  {
    slug: 'near-vintage-pearl-strand',
    title: 'Near-Vintage Akoya Strand',
    era: 'NEAR_VINTAGE',
    shortDescription: 'Akoya pearls on original silk, ordered around 2010. Unworn.',
    longDescription:
      "A clean strand of Akoya pearls strung in the late 2000s, on the original silk with the original 14K clasp. Never sold, never worn. Soft, even luster across the strand. The silk is in good condition for its age; we'd recommend a visual inspection after the first stretch of regular wear, as is standard for any strand more than a few years old.",
    priceCents: 92000,
    goldKarat: 'K14',
    isFinalSale: true,
    returnWindowDays: 0,
    condition: 'NEW_OLD_STOCK',
    conditionNotes: 'On original silk; original clasp. Never worn.',
    collections: ['near-vintage', 'pearls'],
    stones: [{ kind: 'PEARL', notes: 'Akoya' }],
    materials: [{ kind: 'GOLD_YELLOW', notes: '14K clasp' }],
  },
  {
    slug: 'modern-fine-bezel-band',
    title: 'Modern Bezel Band, 14K',
    era: 'MODERN_FINE',
    shortDescription: 'A clean bezel-set diamond band, made new in 14K.',
    longDescription:
      'Made on the bench in 14K yellow gold with five bezel-set brilliants. A clean band that pairs with most stacks. Made to order; lead time is 2 to 3 weeks.',
    priceCents: 154000,
    goldKarat: 'K14',
    gramWeight: 4.1,
    gramWeightVisible: true,
    isResizable: true,
    isFinalSale: false,
    returnWindowDays: 15,
    stockMode: 'REORDERABLE',
    inventoryUnits: 6,
    condition: 'NEW',
    collections: ['modern-fine-jewelry'],
    materials: [{ kind: 'GOLD_YELLOW', notes: '14K' }],
    stones: [{ kind: 'DIAMOND', caratWeight: 0.4, count: 5 }],
  },
]

async function main() {
  console.log('▸ Seeding HV Jewelers dev data')

  // ─── Users ──────────────────────────────────────────────────────────
  // Test passwords. NEVER use these in production. Override via the
  // SEED_ADMIN_PASSWORD / SEED_STAFF_PASSWORD env vars when seeding a
  // shared environment.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'hv-admin-dev-pass'
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? 'hv-staff-dev-pass'
  const customerPassword =
    process.env.SEED_CUSTOMER_PASSWORD ?? 'hv-collector-dev-pass'

  const [adminHash, staffHash, customerHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(staffPassword, 12),
    bcrypt.hash(customerPassword, 12),
  ])

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hvjewelers.test' },
    update: { role: 'ADMIN', passwordHash: adminHash, isDisabled: false },
    create: {
      email: 'admin@hvjewelers.test',
      name: 'HV Admin',
      role: 'ADMIN',
      passwordHash: adminHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'staff@hvjewelers.test' },
    update: { role: 'STAFF', passwordHash: staffHash, isDisabled: false },
    create: {
      email: 'staff@hvjewelers.test',
      name: 'HV Staff',
      role: 'STAFF',
      passwordHash: staffHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'collector@hvjewelers.test' },
    update: { passwordHash: customerHash, isDisabled: false },
    create: {
      email: 'collector@hvjewelers.test',
      name: 'Collector One',
      role: 'CUSTOMER',
      passwordHash: customerHash,
    },
  })

  console.log('  · Test users seeded (admin / staff / collector @hvjewelers.test)')
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('  · Admin password (dev default):', adminPassword)
    console.log('  · Staff password (dev default):', staffPassword)
  }

  // ─── Shipping profiles ──────────────────────────────────────────────
  await prisma.shippingProfile.upsert({
    where: { name: 'Insured Domestic Standard' },
    update: {},
    create: {
      name: 'Insured Domestic Standard',
      description: 'UPS / FedEx insured with standard signature confirmation.',
      baseRateCents: 0,
      isDefault: true,
      signature: 'STANDARD',
      insuranceLevel: 'Up to $5,000',
      carrierPreference: 'UPS or FedEx',
    },
  })
  await prisma.shippingProfile.upsert({
    where: { name: 'High-Value · Adult Signature' },
    update: {},
    create: {
      name: 'High-Value · Adult Signature',
      description: 'For pieces over $5,000. Adult signature required; jeweler-grade insurance.',
      baseRateCents: 0,
      isDefault: false,
      signature: 'ADULT',
      insuranceLevel: 'Up to $25,000',
      carrierPreference: 'FedEx',
    },
  })

  // ─── Collections ────────────────────────────────────────────────────
  const collectionIdBySlug = new Map<string, string>()
  for (const [i, c] of COLLECTIONS.entries()) {
    const created = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { title: c.title, kind: c.kind, isPublished: true },
      create: {
        slug: c.slug,
        title: c.title,
        kind: c.kind,
        position: i,
        isPublished: true,
      },
    })
    collectionIdBySlug.set(c.slug, created.id)
  }

  // ─── Products + per-unit inventory ──────────────────────────────────
  for (const seed of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        priceCents: seed.priceCents,
        compareAtCents: seed.compareAtCents ?? null,
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        shortDescription: seed.shortDescription,
        longDescription: seed.longDescription,
        era: seed.era,
        status: 'ACTIVE',
        priceCents: seed.priceCents,
        compareAtCents: seed.compareAtCents ?? null,
        goldKarat: seed.goldKarat ?? 'NONE',
        gramWeight: seed.gramWeight as unknown as Prisma.Decimal | undefined,
        gramWeightVisible: seed.gramWeightVisible ?? false,
        ringSize: seed.ringSize,
        isResizable: seed.isResizable ?? false,
        resizeNotes: seed.resizeNotes,
        isFinalSale: seed.isFinalSale ?? true,
        returnWindowDays: seed.returnWindowDays ?? 0,
        signed: seed.signed ?? false,
        signedNotes: seed.signedNotes,
        condition: seed.condition,
        conditionNotes: seed.conditionNotes,
        stockMode: seed.stockMode ?? 'ONE_OF_ONE',
        isFeatured: seed.isFeatured ?? false,
        isNewArrival: seed.isNewArrival ?? false,
        publishedAt: new Date(),
      },
    })

    // Reset and reattach collection memberships
    await prisma.productCollection.deleteMany({ where: { productId: product.id } })
    for (const slug of seed.collections) {
      const collectionId = collectionIdBySlug.get(slug)
      if (!collectionId) continue
      await prisma.productCollection.create({
        data: { productId: product.id, collectionId },
      })
    }

    // Materials & stones — reset and rewrite
    await prisma.productMaterial.deleteMany({ where: { productId: product.id } })
    if (seed.materials?.length) {
      await prisma.productMaterial.createMany({
        data: seed.materials.map((m) => ({
          productId: product.id,
          kind: m.kind,
          notes: m.notes,
        })),
      })
    }

    await prisma.productStone.deleteMany({ where: { productId: product.id } })
    if (seed.stones?.length) {
      await prisma.productStone.createMany({
        data: seed.stones.map((s) => ({
          productId: product.id,
          kind: s.kind,
          caratWeight: s.caratWeight as unknown as Prisma.Decimal | undefined,
          count: s.count,
          notes: s.notes,
        })),
      })
    }

    // Inventory items — only create up to the desired count.
    const desiredUnits =
      seed.inventoryUnits ??
      (seed.stockMode === 'MADE_TO_ORDER' ? 0 : 1)
    const existing = await prisma.inventoryItem.count({ where: { productId: product.id } })
    if (existing < desiredUnits) {
      const toCreate = desiredUnits - existing
      for (let i = 0; i < toCreate; i++) {
        const item = await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            sku: `${seed.slug}-${(existing + i + 1).toString().padStart(2, '0')}`,
            status: 'AVAILABLE',
          },
        })
        await prisma.inventoryLedger.create({
          data: {
            inventoryItemId: item.id,
            event: 'RECEIVED',
            toStatus: 'AVAILABLE',
            actorId: admin.id,
            reason: 'seed.initial',
          },
        })
      }
    }
  }

  // ─── Editorial posts ────────────────────────────────────────────────
  const editorial = [
    {
      slug: 'on-vintage-era',
      title: 'On the Vintage Era',
      excerpt:
        'Why we describe condition in plain words, and what "Vintage Era" really means in the archive.',
      publishedAt: new Date('2026-03-15T10:00:00Z'),
      body: `The word "vintage" gets used loosely. We use **Vintage Era** for a reason.

Most places say "vintage" and mean previously owned, often well-worn. We don't carry that. **Vintage Era** at HV means a piece made in the 1980s or 1990s that has never been worn or sold. Not "in the style of," not "vintage-inspired." Actually that old, but unused. These came directly from jewelry stores that kept them in stock — sometimes for decades — without ever finding a buyer.

## How that works

Jewelry stores order more than they sell. Display pieces stay in cases for years. When a store closes, downsizes, or clears old inventory, those unsold pieces have to go somewhere. We work with a short list of store owners and trade dealers, look at every piece in person, and only list what we can verify.

So it's a narrower set than "vintage" usually delivers: old enough to count, but new in the sense that nobody's worn it.

## On condition

These pieces have been sitting in showcases and inventory drawers for decades. They haven't been worn, but storage leaves its own small marks. We describe what we see in plain words:

- **New, old stock.** Older inventory, never worn or sold. Most of our Vintage Era catalog. Sometimes still in original packaging.
- **Excellent.** Unworn, with the kind of minor surface marks you'd expect from long storage (a faint scuff on a band's back, a touch of tarnish). No structural issues.

We don't restore. We don't polish them up. The pieces come to you the way they came to us, and we describe them honestly so you know what to expect.

## On signatures

A lot of what we sell is unsigned. That's normal for the era and for pieces ordered for retail by stores that didn't print their own marks. We describe craft and material; we don't invent a maker.

When a piece is signed, we read the punch and report what we read.

## On final sale

Vintage Era pieces are final sale. The reasoning is structural: an older piece going round-trip through shipping multiple times runs real risk. We describe each piece carefully so you can decide before you buy, and if something arrives not as described, we make it right.

That's the deal.`,
    },
    {
      slug: 'material-honesty',
      title: 'Material Honesty',
      excerpt:
        'Why we lead with craft and material, and only get to the maker if it adds something true.',
      publishedAt: new Date('2026-03-29T10:00:00Z'),
      body: `A piece tells the truth about itself if you look at it long enough.

Gold reads on the touch. A carve reads in the light. A setting either holds a stone or it doesn't. Before we look up a maker's mark or chase down provenance, we look at the piece itself.

## Three things we check

When a piece arrives, we check it in this order:

1. **Material.** Acid test where appropriate, a loupe for the stone, a magnet on the chain. The piece is whatever it actually is, not whatever the seller called it.
2. **Craft.** Are the prongs even? Is the bezel rolled clean? Does the engraving show the same hand on both sides of a signet? Careful makers leave careful details.
3. **Story.** *Then* we look at the hallmark, the provenance, whatever paperwork came with it. Story comes last because story is the easiest part to fake.

## When we pass on a piece

We've turned down pieces with confident-sounding provenance because the math didn't work: weight wrong for the listed karat, carve finished in two visibly different passes, a setting redone in a way that hides damage. When a piece doesn't pass, we don't write a softer description. We just don't list it.

## What we won't do

The reverse is also true. We won't invent a story to make a piece sound rarer. If a signet is 14K, well-cut, and an honest weight, we'll say that. We won't call it "imperial" or "museum-grade" unless those words actually fit.

We trust the piece. We trust you. We try not to get in the way.`,
    },
  ]

  for (const post of editorial) {
    await prisma.editorialPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        publishedAt: post.publishedAt,
        status: 'PUBLISHED',
        authorId: admin.id,
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        publishedAt: post.publishedAt,
        status: 'PUBLISHED',
        authorId: admin.id,
      },
    })
  }

  // ─── Homepage sections ──────────────────────────────────────────────
  const homepageSeed: Array<{ position: number; type: Parameters<typeof prisma.homepageSection.create>[0]['data']['type']; data: Prisma.InputJsonValue }> = [
    {
      position: 0,
      type: 'HERO',
      data: {
        eyebrow: 'Hoang Vi Jewelers',
        headline: 'Vintage Era and modern fine jewelry. Every piece unworn.',
        primaryCta: { label: 'See New Arrivals', href: '/collections/new-arrivals' },
        secondaryCta: { label: 'About the house', href: '/about' },
      },
    },
    {
      position: 1,
      type: 'NEW_ARRIVALS_GRID',
      data: { count: 6 },
    },
  ]

  for (const s of homepageSeed) {
    const existing = await prisma.homepageSection.findFirst({
      where: { type: s.type, position: s.position },
    })
    if (existing) {
      await prisma.homepageSection.update({
        where: { id: existing.id },
        data: { data: s.data, isPublished: true },
      })
    } else {
      await prisma.homepageSection.create({
        data: {
          type: s.type,
          position: s.position,
          isPublished: true,
          data: s.data,
        },
      })
    }
  }

  console.log('✓ Seed complete.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
