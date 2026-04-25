'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  passwordStrengthIssues,
} from '@/lib/auth/passwords'
import { hashInviteToken } from '@/lib/auth/invites'
import { audit } from '@/lib/auth/audit'
import { authLimiter, getClientKey } from '@/lib/rate-limit'

const acceptInput = z
  .object({
    token: z.string().min(8).max(200),
    password: z.string().min(12).max(256),
    confirm: z.string().min(12).max(256),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })

function backToInvite(token: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ token, ...params }).toString()
  return `/invite?${qs}`
}

export async function acceptInviteAction(formData: FormData) {
  const raw = {
    token: String(formData.get('token') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirm: String(formData.get('confirm') ?? ''),
  }

  const parsed = acceptInput.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    redirect(
      backToInvite(raw.token, {
        error: firstError?.path[0] === 'confirm' ? 'mismatch' : 'invalid',
      }),
    )
  }
  const { token, password } = parsed.data

  // Rate-limit invite acceptance by (IP + token) so token-guessing is
  // bounded even if a user somehow got a close-but-wrong token.
  const requestHeaders = await headers()
  const key = `${getClientKey(requestHeaders)}:invite:${token.slice(0, 12)}`
  try {
    const rl = await authLimiter.limit(key)
    if (!rl.success) {
      redirect(backToInvite(token, { error: 'rate_limit' }))
    }
  } catch {
    redirect(backToInvite(token, { error: 'unavailable' }))
  }

  const strength = passwordStrengthIssues(password)
  if (strength.length > 0) {
    redirect(backToInvite(token, { error: 'weak' }))
  }

  const tokenHash = hashInviteToken(token)
  const user = await prisma.user.findFirst({
    where: { inviteTokenHash: tokenHash },
    select: { id: true, email: true, inviteExpiresAt: true, isDisabled: true },
  })

  if (!user || user.isDisabled) {
    redirect(backToInvite(token, { error: 'invalid' }))
  }
  if (!user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
    redirect(backToInvite(token, { error: 'expired' }))
  }

  const passwordHash = await hashPassword(password)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      inviteTokenHash: null,
      inviteExpiresAt: null,
      emailVerified: new Date(),
    },
  })

  const ua = requestHeaders.get('user-agent') ?? null
  const ip =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    requestHeaders.get('x-real-ip') ??
    null

  await audit({
    actorId: user.id,
    action: 'auth.password.set',
    resourceType: 'User',
    resourceId: user.id,
    ip,
    userAgent: ua,
    context: { via: 'invite' },
  })

  redirect(`/login?from=/admin&from_invite=1&email=${encodeURIComponent(user.email)}`)
}
