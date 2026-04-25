'use server'

import { auth, signOut } from '@/auth'
import { audit, auditRequestContext } from '@/lib/auth/audit'

export async function signOutAction() {
  const session = await auth()
  if (session?.user?.id) {
    const ctx = await auditRequestContext()
    await audit({
      actorId: session.user.id,
      action: 'auth.signout',
      resourceType: 'User',
      resourceId: session.user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    })
  }
  await signOut({ redirectTo: '/' })
}
