'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit, auditRequestContext } from '@/lib/auth/audit'
import { productCreateInput, productUpdateInput } from '@/lib/validation/product'

// ─── Form data helpers ────────────────────────────────────────────────

function s(formData: FormData, k: string) {
  return String(formData.get(k) ?? '')
}
function opt(formData: FormData, k: string): string | null {
  const v = formData.get(k)
  return v && String(v).trim() ? String(v).trim() : null
}
function bool(formData: FormData, k: string) {
  return formData.get(k) === 'on'
}
function dollars(formData: FormData, k: string): number | null {
  const v = formData.get(k)
  if (!v || String(v).trim() === '') return null
  const n = parseFloat(String(v))
  return isNaN(n) ? null : Math.round(n * 100)
}
function numOpt(formData: FormData, k: string): number | null {
  const v = formData.get(k)
  if (!v || String(v).trim() === '') return null
  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
}

function fromFormData(formData: FormData) {
  let materials: unknown[] = []
  let stones: unknown[] = []
  try {
    const j = formData.get('materialsJson')
    if (j) materials = JSON.parse(String(j))
  } catch { /* ignore */ }
  try {
    const j = formData.get('stonesJson')
    if (j) stones = JSON.parse(String(j))
  } catch { /* ignore */ }

  return {
    slug: s(formData, 'slug'),
    title: s(formData, 'title'),
    shortDescription: opt(formData, 'shortDescription'),
    longDescription: opt(formData, 'longDescription'),
    era: s(formData, 'era'),
    status: s(formData, 'status'),
    isHidden: bool(formData, 'isHidden'),
    priceCents: dollars(formData, 'price') ?? 0,
    compareAtCents: dollars(formData, 'compareAt'),
    currency: s(formData, 'currency') || 'USD',
    materialsText: opt(formData, 'materialsText'),
    stonesText: opt(formData, 'stonesText'),
    dimensionsText: opt(formData, 'dimensionsText'),
    goldKarat: s(formData, 'goldKarat') || 'NONE',
    gramWeight: numOpt(formData, 'gramWeight'),
    gramWeightVisible: bool(formData, 'gramWeightVisible'),
    ringSize: opt(formData, 'ringSize'),
    isResizable: bool(formData, 'isResizable'),
    resizeNotes: opt(formData, 'resizeNotes'),
    resizeVoidsReturn: bool(formData, 'resizeVoidsReturn'),
    stockMode: s(formData, 'stockMode') || 'ONE_OF_ONE',
    isReorderable: bool(formData, 'isReorderable'),
    isFinalSale: bool(formData, 'isFinalSale'),
    returnWindowDays: Number(formData.get('returnWindowDays') ?? 0) || 0,
    signed: bool(formData, 'signed'),
    signedNotes: opt(formData, 'signedNotes'),
    provenance: opt(formData, 'provenance'),
    condition: s(formData, 'condition') || 'EXCELLENT',
    conditionNotes: opt(formData, 'conditionNotes'),
    isFeatured: bool(formData, 'isFeatured'),
    isNewArrival: bool(formData, 'isNewArrival'),
    shippingProfileId: opt(formData, 'shippingProfileId'),
    metaTitle: opt(formData, 'metaTitle'),
    metaDescription: opt(formData, 'metaDescription'),
    collectionIds: formData.getAll('collectionIds').map(String).filter(Boolean),
    materials,
    stones,
    images: [],
  }
}

// ─── Create ───────────────────────────────────────────────────────────

export async function createProductAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const raw = fromFormData(formData)
  const parsed = productCreateInput.safeParse(raw)
  if (!parsed.success) {
    redirect('/admin/products/new?error=invalid')
  }

  const ctx = await auditRequestContext()
  const { collectionIds, materials, stones, images: _images, ...fields } = parsed.data

  try {
    const product = await prisma.product.create({
      data: {
        ...fields,
        publishedAt: fields.status === 'ACTIVE' ? new Date() : null,
        collections: collectionIds.length > 0
          ? { create: collectionIds.map((collectionId, position) => ({ collectionId, position })) }
          : undefined,
        materials: materials.length > 0
          ? { create: materials.map((m) => ({ kind: m.kind, notes: m.notes ?? null })) }
          : undefined,
        stones: stones.length > 0
          ? { create: stones.map((st) => ({
              kind: st.kind,
              caratWeight: st.caratWeight ?? null,
              count: st.count ?? null,
              notes: st.notes ?? null,
            })) }
          : undefined,
      },
    })
    await audit({
      actorId: user.id,
      action: 'product.create',
      resourceType: 'Product',
      resourceId: product.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      after: { slug: product.slug, title: product.title, era: product.era, status: product.status },
    })
    revalidatePath('/admin/products')
    redirect(`/admin/products/${product.id}?created=1`)
  } catch (err) {
    console.error('[products] create failed', err)
    redirect('/admin/products/new?error=exists')
  }
}

// ─── Update ───────────────────────────────────────────────────────────

export async function updateProductAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = s(formData, 'id')
  if (!id) redirect('/admin/products')

  const raw = { id, ...fromFormData(formData) }
  const parsed = productUpdateInput.safeParse(raw)
  if (!parsed.success) {
    redirect(`/admin/products/${id}?error=invalid`)
  }

  const ctx = await auditRequestContext()
  const before = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, title: true, status: true, era: true, priceCents: true },
  })

  const { id: _id, collectionIds = [], materials = [], stones = [], images: _images, ...fields } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id }, select: { status: true, publishedAt: true } })
      const publishedAt =
        fields.status === 'ACTIVE' && existing?.status !== 'ACTIVE' && !existing?.publishedAt
          ? new Date()
          : undefined

      await tx.product.update({
        where: { id },
        data: { ...fields, ...(publishedAt ? { publishedAt } : {}) },
      })

      await tx.productCollection.deleteMany({ where: { productId: id } })
      if (collectionIds.length > 0) {
        await tx.productCollection.createMany({
          data: collectionIds.map((collectionId, position) => ({ productId: id, collectionId, position })),
        })
      }

      await tx.productMaterial.deleteMany({ where: { productId: id } })
      if (materials.length > 0) {
        await tx.productMaterial.createMany({
          data: materials.map((m) => ({ productId: id, kind: m.kind, notes: m.notes ?? null })),
        })
      }

      await tx.productStone.deleteMany({ where: { productId: id } })
      if (stones.length > 0) {
        await tx.productStone.createMany({
          data: stones.map((st) => ({
            productId: id,
            kind: st.kind,
            caratWeight: st.caratWeight ?? null,
            count: st.count ?? null,
            notes: st.notes ?? null,
          })),
        })
      }
    })

    await audit({
      actorId: user.id,
      action: 'product.update',
      resourceType: 'Product',
      resourceId: id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      before: before ?? undefined,
      after: { slug: fields.slug, title: fields.title, status: fields.status, priceCents: fields.priceCents },
    })
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}`)
    revalidatePath(`/products/${fields.slug}`)
    redirect(`/admin/products/${id}?saved=1`)
  } catch (err) {
    console.error('[products] update failed', err)
    redirect(`/admin/products/${id}?error=save`)
  }
}

// ─── Quick toggles ────────────────────────────────────────────────────

export async function archiveProductAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = s(formData, 'id')
  if (!id) redirect('/admin/products')
  const ctx = await auditRequestContext()
  await prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } })
  await audit({ actorId: user.id, action: 'product.archive', resourceType: 'Product', resourceId: id, ip: ctx.ip, userAgent: ctx.userAgent })
  revalidatePath('/admin/products')
  redirect(`/admin/products/${id}?archived=1`)
}

export async function toggleFeaturedAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = s(formData, 'id')
  const next = formData.get('featured') === '1'
  if (!id) redirect('/admin/products')
  const ctx = await auditRequestContext()
  await prisma.product.update({ where: { id }, data: { isFeatured: next } })
  await audit({ actorId: user.id, action: next ? 'product.feature' : 'product.unfeature', resourceType: 'Product', resourceId: id, ip: ctx.ip, userAgent: ctx.userAgent })
  revalidatePath('/admin/products')
  redirect(`/admin/products/${id}?saved=1`)
}

export async function toggleNewArrivalAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = s(formData, 'id')
  const next = formData.get('newArrival') === '1'
  if (!id) redirect('/admin/products')
  const ctx = await auditRequestContext()
  await prisma.product.update({ where: { id }, data: { isNewArrival: next } })
  await audit({ actorId: user.id, action: next ? 'product.markNewArrival' : 'product.unmarkNewArrival', resourceType: 'Product', resourceId: id, ip: ctx.ip, userAgent: ctx.userAgent })
  revalidatePath('/admin/products')
  redirect(`/admin/products/${id}?saved=1`)
}

export async function toggleHiddenAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = s(formData, 'id')
  const next = formData.get('hidden') === '1'
  if (!id) redirect('/admin/products')
  const ctx = await auditRequestContext()
  await prisma.product.update({ where: { id }, data: { isHidden: next } })
  await audit({ actorId: user.id, action: next ? 'product.hide' : 'product.unhide', resourceType: 'Product', resourceId: id, ip: ctx.ip, userAgent: ctx.userAgent })
  revalidatePath('/admin/products')
  redirect(`/admin/products/${id}?saved=1`)
}

// ─── Images ───────────────────────────────────────────────────────────

export async function addProductImageAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const productId = s(formData, 'productId')
  if (!productId) redirect('/admin/products')

  const cloudinaryPublicId = s(formData, 'cloudinaryPublicId').trim()
  const url = s(formData, 'url').trim()
  const alt = opt(formData, 'alt')
  if (!cloudinaryPublicId || !url) redirect(`/admin/products/${productId}?error=image`)

  const ctx = await auditRequestContext()
  const maxPos = await prisma.productImage.aggregate({ where: { productId }, _max: { position: true } })
  const position = (maxPos._max.position ?? -1) + 1

  await prisma.productImage.create({ data: { productId, cloudinaryPublicId, url, alt, position } })
  await audit({ actorId: user.id, action: 'product.addImage', resourceType: 'Product', resourceId: productId, ip: ctx.ip, userAgent: ctx.userAgent, after: { url } })
  revalidatePath(`/admin/products/${productId}`)
  redirect(`/admin/products/${productId}?saved=1`)
}

export async function removeProductImageAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const imageId = s(formData, 'imageId')
  const productId = s(formData, 'productId')
  if (!imageId || !productId) redirect('/admin/products')

  const ctx = await auditRequestContext()
  await prisma.productImage.delete({ where: { id: imageId } })
  await audit({ actorId: user.id, action: 'product.removeImage', resourceType: 'Product', resourceId: productId, ip: ctx.ip, userAgent: ctx.userAgent })
  revalidatePath(`/admin/products/${productId}`)
  redirect(`/admin/products/${productId}?saved=1`)
}

export async function setHeroImageAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const imageId = s(formData, 'imageId')
  const productId = s(formData, 'productId')
  if (!imageId || !productId) redirect('/admin/products')

  const ctx = await auditRequestContext()
  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId }, data: { isHero: false, position: undefined } }),
    prisma.productImage.update({ where: { id: imageId }, data: { isHero: true, position: 0 } }),
  ])
  await audit({ actorId: user.id, action: 'product.setHeroImage', resourceType: 'Product', resourceId: productId, ip: ctx.ip, userAgent: ctx.userAgent })
  revalidatePath(`/admin/products/${productId}`)
  redirect(`/admin/products/${productId}?saved=1`)
}

// ─── Inventory units ──────────────────────────────────────────────────

export async function addInventoryUnitAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const productId = s(formData, 'productId')
  if (!productId) redirect('/admin/products')

  const skuRaw = opt(formData, 'sku')
  const internalRef = opt(formData, 'internalRef')
  const costCents = dollars(formData, 'cost')
  const ctx = await auditRequestContext()

  try {
    const unit = await prisma.inventoryItem.create({
      data: { productId, sku: skuRaw ?? undefined, internalRef, costCents, status: 'AVAILABLE' },
    })
    await audit({ actorId: user.id, action: 'inventory.addUnit', resourceType: 'InventoryItem', resourceId: unit.id, ip: ctx.ip, userAgent: ctx.userAgent, after: { productId, sku: unit.sku } })
    revalidatePath(`/admin/products/${productId}`)
    redirect(`/admin/products/${productId}?saved=1`)
  } catch (err) {
    console.error('[inventory] add unit failed', err)
    redirect(`/admin/products/${productId}?error=sku`)
  }
}

export async function removeInventoryUnitAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const unitId = s(formData, 'unitId')
  const productId = s(formData, 'productId')
  if (!unitId || !productId) redirect('/admin/products')

  const unit = await prisma.inventoryItem.findUnique({ where: { id: unitId }, select: { status: true } })
  if (!unit || unit.status !== 'AVAILABLE') {
    redirect(`/admin/products/${productId}?error=unit`)
  }

  const ctx = await auditRequestContext()
  await prisma.inventoryItem.delete({ where: { id: unitId } })
  await audit({ actorId: user.id, action: 'inventory.removeUnit', resourceType: 'InventoryItem', resourceId: unitId, ip: ctx.ip, userAgent: ctx.userAgent })
  revalidatePath(`/admin/products/${productId}`)
  redirect(`/admin/products/${productId}?saved=1`)
}
