import type { Metadata } from 'next'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

/**
 * Server-side gate for the entire /admin tree. Middleware blocks
 * unauthenticated access and bounces to /login; this layout re-checks
 * on every request, re-reading the user's role from the database so
 * disabled accounts and role changes take effect immediately.
 *
 * Every admin child page should additionally call `requireStaffOrAdmin()`
 * or `requireAdmin()` from its server component or server action — never
 * trust this layout alone.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireStaffOrAdmin()

  return <AdminShell user={session.user}>{children}</AdminShell>
}
