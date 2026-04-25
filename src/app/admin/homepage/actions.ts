'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit, auditRequestContext } from '@/lib/auth/audit'
import { cuidSchema } from '@/lib/validation/common'

/**
 * Homepage section operations — reorder and publish toggle. Full
 * type-specific editing of the `data` JSON would require distinct
 * forms per section type; the schema supports it already, and a
 * per-type editor is scoped for a later phase.
 */

const reorderInput = z.object({
  id: cuidSchema,
  direction: z.enum(['up', 'down']),
})

const toggleInput = z.object({
  id: cuidSchema,
  publish: z.enum(['0', '1']),
})

export async function reorderHomepageSectionAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const parsed = reorderInput.safeParse({
    id: formData.get('id'),
    direction: formData.get('direction'),
  })
  if (!parsed.success) redirect('/admin/homepage')
  const { id, direction } = parsed.data

  const current = await prisma.homepageSection.findUnique({
    where: { id },
    select: { id: true, position: true, isPublished: true, type: true },
  })
  if (!current) redirect('/admin/homepage')

  // Find the immediate neighbour in the requested direction.
  const neighbour = await prisma.homepageSection.findFirst({
    where: {
      position:
        direction === 'up'
          ? { lt: current.position }
          : { gt: current.position },
    },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
    select: { id: true, position: true },
  })

  if (!neighbour) redirect('/admin/homepage?at_edge=1')

  // Swap positions. Transaction so we never leave the table with a
  // duplicate position.
  await prisma.$transaction(async (tx) => {
    await tx.homepageSection.update({
      where: { id: current.id },
      data: { position: neighbour.position },
    })
    await tx.homepageSection.update({
      where: { id: neighbour.id },
      data: { position: current.position },
    })
  })

  const ctx = await auditRequestContext()
  await audit({
    actorId: user.id,
    action: 'homepage.reorder',
    resourceType: 'HomepageSection',
    resourceId: current.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    context: { direction, swappedWith: neighbour.id },
  })

  revalidatePath('/admin/homepage')
  revalidatePath('/')
  redirect('/admin/homepage?moved=1')
}

export async function togglePublishHomepageSectionAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()
  const parsed = toggleInput.safeParse({
    id: formData.get('id'),
    publish: formData.get('publish'),
  })
  if (!parsed.success) redirect('/admin/homepage')

  const next = parsed.data.publish === '1'
  await prisma.homepageSection.update({
    where: { id: parsed.data.id },
    data: { isPublished: next },
  })

  const ctx = await auditRequestContext()
  await audit({
    actorId: user.id,
    action: next ? 'homepage.publish' : 'homepage.unpublish',
    resourceType: 'HomepageSection',
    resourceId: parsed.data.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  })

  revalidatePath('/admin/homepage')
  revalidatePath('/')
  redirect(`/admin/homepage?${next ? 'published' : 'unpublished'}=1`)
}
