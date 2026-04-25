'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit, auditRequestContext } from '@/lib/auth/audit'
import {
  collectionInput,
  collectionUpdateInput,
} from '@/lib/validation/collection'

function fromFormData(formData: FormData) {
  return {
    slug: String(formData.get('slug') ?? ''),
    title: String(formData.get('title') ?? ''),
    kind: String(formData.get('kind') ?? ''),
    description: formData.get('description')
      ? String(formData.get('description'))
      : null,
    heroImagePublicId: formData.get('heroImagePublicId')
      ? String(formData.get('heroImagePublicId'))
      : null,
    heroImageUrl: formData.get('heroImageUrl')
      ? String(formData.get('heroImageUrl'))
      : null,
    position: Number(formData.get('position') ?? 0),
    isPublished: formData.get('isPublished') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    metaTitle: formData.get('metaTitle')
      ? String(formData.get('metaTitle'))
      : null,
    metaDescription: formData.get('metaDescription')
      ? String(formData.get('metaDescription'))
      : null,
  }
}

export async function createCollectionAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const parsed = collectionInput.safeParse(fromFormData(formData))
  if (!parsed.success) {
    // Return to new form with an error flag. Zod's messages are the
    // truth but for Phase 9 we keep a single aggregate error indicator.
    redirect('/admin/collections/new?error=invalid')
  }

  const ctx = await auditRequestContext()

  try {
    const created = await prisma.collection.create({ data: parsed.data })
    await audit({
      actorId: user.id,
      action: 'collection.create',
      resourceType: 'Collection',
      resourceId: created.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      after: { slug: created.slug, title: created.title, kind: created.kind },
    })
    revalidatePath('/admin/collections')
    redirect(`/admin/collections/${created.id}?created=1`)
  } catch (err) {
    console.error('[collections] create failed', err)
    redirect('/admin/collections/new?error=exists')
  }
}

export async function updateCollectionAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/collections')

  const parsed = collectionUpdateInput.safeParse({
    id,
    ...fromFormData(formData),
  })
  if (!parsed.success) {
    redirect(`/admin/collections/${id}?error=invalid`)
  }

  const ctx = await auditRequestContext()
  const before = await prisma.collection.findUnique({
    where: { id },
    select: {
      slug: true,
      title: true,
      isPublished: true,
      isFeatured: true,
      position: true,
    },
  })

  try {
    const { id: _id, ...data } = parsed.data
    const updated = await prisma.collection.update({
      where: { id },
      data,
    })
    await audit({
      actorId: user.id,
      action: 'collection.update',
      resourceType: 'Collection',
      resourceId: id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      before: before ?? undefined,
      after: {
        slug: updated.slug,
        title: updated.title,
        isPublished: updated.isPublished,
        isFeatured: updated.isFeatured,
        position: updated.position,
      },
    })
    revalidatePath('/admin/collections')
    revalidatePath(`/admin/collections/${id}`)
    redirect(`/admin/collections/${id}?saved=1`)
  } catch (err) {
    console.error('[collections] update failed', err)
    redirect(`/admin/collections/${id}?error=save`)
  }
}

export async function togglePublishCollectionAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const id = String(formData.get('id') ?? '')
  const nextState = formData.get('publish') === '1'
  if (!id) redirect('/admin/collections')

  const ctx = await auditRequestContext()
  await prisma.collection.update({
    where: { id },
    data: { isPublished: nextState },
  })
  await audit({
    actorId: user.id,
    action: nextState ? 'collection.publish' : 'collection.unpublish',
    resourceType: 'Collection',
    resourceId: id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  })
  revalidatePath('/admin/collections')
  redirect('/admin/collections?toggled=1')
}
