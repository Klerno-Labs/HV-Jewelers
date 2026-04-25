'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit, auditRequestContext } from '@/lib/auth/audit'
import {
  INVITE_TTL_MS,
  generateInviteToken,
} from '@/lib/auth/invites'
import { sendStaffInvite } from '@/lib/emails/send'

/**
 * Staff invite flow — ADMIN-only. Creates the User row with no password
 * but a hashed, one-time invite token. Sends the raw token in the
 * invite email link. On first sign-in at /invite?token=…, the user
 * sets a password; the invite hash is cleared.
 */

const inviteInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(140).optional().nullable(),
  role: z.enum(['STAFF', 'ADMIN']),
})

const ROLE_LABEL: Record<'STAFF' | 'ADMIN', string> = {
  STAFF: 'Staff',
  ADMIN: 'Administrator',
}

export async function inviteStaffAction(formData: FormData) {
  const { user: actor } = await requireAdmin()

  const parsed = inviteInput.safeParse({
    email: formData.get('email'),
    name: formData.get('name') || null,
    role: formData.get('role'),
  })
  if (!parsed.success) {
    redirect('/admin/users/new?error=invalid')
  }
  const { email, name, role } = parsed.data

  const { raw, hash } = generateInviteToken()
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
  const ctx = await auditRequestContext()

  // Upsert by email: allows re-inviting a user whose first invite
  // lapsed. If they have a passwordHash already, do not overwrite —
  // re-inviting an active account would be weird; just refresh role.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true, name: true, isDisabled: true },
  })

  if (existing?.passwordHash) {
    // Already activated. Update role if it changed, skip invite email.
    if (existing.role !== role || existing.isDisabled) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role, isDisabled: false },
      })
      await audit({
        actorId: actor.id,
        action: 'user.role.change',
        resourceType: 'User',
        resourceId: existing.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        before: { role: existing.role, isDisabled: existing.isDisabled },
        after: { role, isDisabled: false },
        context: { email },
      })
    }
    redirect('/admin/users?promoted=1')
  }

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name ?? existing.name,
          role,
          isDisabled: false,
          inviteTokenHash: hash,
          inviteExpiresAt: expiresAt,
        },
      })
    : await prisma.user.create({
        data: {
          email,
          name,
          role,
          inviteTokenHash: hash,
          inviteExpiresAt: expiresAt,
        },
      })

  await audit({
    actorId: actor.id,
    action: 'user.invite',
    resourceType: 'User',
    resourceId: user.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    context: { email, role, expiresAt: expiresAt.toISOString() },
  })

  // Send the invite email. If the email path fails, the invite still
  // exists — an admin can re-invite and the token gets refreshed.
  try {
    await sendStaffInvite({
      to: email,
      inviteeName: name ?? null,
      inviterName: actor.name ?? actor.email,
      rawToken: raw,
      roleLabel: ROLE_LABEL[role],
      expiresAt,
    })
  } catch (err) {
    console.error('[users] staff invite email failed', err)
  }

  revalidatePath('/admin/users')
  redirect('/admin/users?invited=1')
}

export async function disableUserAction(formData: FormData) {
  const { user: actor } = await requireAdmin()
  const userId = String(formData.get('userId') ?? '')
  if (!userId) redirect('/admin/users')
  if (userId === actor.id) {
    // Don't let an admin disable themselves — easy way to brick access.
    redirect('/admin/users?error=self_disable')
  }
  const ctx = await auditRequestContext()
  await prisma.user.update({
    where: { id: userId },
    data: { isDisabled: true },
  })
  await audit({
    actorId: actor.id,
    action: 'user.disable',
    resourceType: 'User',
    resourceId: userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  })
  revalidatePath('/admin/users')
  redirect('/admin/users?disabled=1')
}
