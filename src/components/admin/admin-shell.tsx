import Link from 'next/link'
import type { UserRole } from '@/auth.config'
import { AdminNav } from './admin-nav'
import { SignOutButton } from './sign-out-button'

interface AdminShellProps {
  user: { id: string; email: string; role: UserRole; name?: string | null }
  children: React.ReactNode
}

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CUSTOMER: 'Customer',
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-limestone-deep/60 bg-parchment lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex h-full flex-col p-8">
          <div>
            <Link
              href="/"
              className="block font-serif text-title leading-none text-ink hover:opacity-80"
            >
              HV Jewelers
            </Link>
            <p className="mt-2 text-eyebrow text-bronze">Admin · Hong Vi</p>
          </div>

          <div className="mt-12 flex-1 overflow-y-auto">
            <AdminNav role={user.role} />
          </div>

          <div className="mt-12 border-t border-limestone-deep/60 pt-6">
            <p className="text-eyebrow text-ink-muted">Signed in as</p>
            <p className="mt-2 truncate text-caption text-ink">{user.email}</p>
            <p className="mt-1 text-eyebrow text-bronze">{ROLE_LABEL[user.role]}</p>
            <div className="mt-5 flex items-center gap-4">
              <Link
                href="/"
                className="text-caption text-ink-soft transition-colors duration-300 hover:text-olive"
              >
                Storefront ↗
              </Link>
              <span className="h-3 w-px bg-limestone-deep" aria-hidden />
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      <main className="bg-limestone/30">{children}</main>
    </div>
  )
}
