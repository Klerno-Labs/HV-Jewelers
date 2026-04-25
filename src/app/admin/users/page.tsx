import Link from 'next/link'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { disableUserAction } from './actions'

const ROLE_LABEL = {
  CUSTOMER: 'Customer',
  STAFF: 'Staff',
  ADMIN: 'Admin',
} as const

const BANNERS: Record<string, string> = {
  invited: 'Invite sent. The recipient will set their password on first sign-in.',
  promoted: 'Existing user role updated.',
  disabled: 'User disabled. They cannot sign in until re-enabled.',
  self_disable: "You can't disable your own account from here.",
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams
  const now = new Date()

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isDisabled: true,
      lastSignInAt: true,
      createdAt: true,
      passwordHash: true,
      inviteTokenHash: true,
      inviteExpiresAt: true,
    },
    take: 500,
  })

  const banner = Object.keys(BANNERS).find((k) => sp[k])

  return (
    <>
      <AdminPageHeader
        eyebrow="Settings"
        title="Users & Staff"
        description="Invite staff, change roles, disable access. Customers sign in through the public account flow."
        actions={
          <Link
            href="/admin/users/new"
            className="inline-flex h-9 items-center bg-ink px-4 text-eyebrow text-parchment hover:opacity-85"
          >
            Invite staff
          </Link>
        }
      />
      <AdminPageBody>
        {banner ? (
          <p
            role={banner === 'self_disable' ? 'alert' : 'status'}
            className={`mb-6 inline-block border-l py-3 pl-4 pr-6 text-caption ${
              banner === 'self_disable'
                ? 'border-cedar-deep bg-cedar/10 text-cedar-deep'
                : 'border-olive bg-olive/10 text-olive-deep'
            }`}
          >
            {BANNERS[banner]}
          </p>
        ) : null}

        <div className="border border-limestone-deep/60 bg-parchment">
          <table className="w-full text-caption">
            <thead className="border-b border-limestone-deep/60 text-eyebrow text-ink-muted">
              <tr>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Last sign-in</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-limestone-deep/40">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-ink-muted">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const hasPendingInvite =
                    !u.passwordHash &&
                    u.inviteTokenHash &&
                    u.inviteExpiresAt &&
                    u.inviteExpiresAt > now
                  const inviteExpired =
                    !u.passwordHash &&
                    u.inviteTokenHash &&
                    u.inviteExpiresAt &&
                    u.inviteExpiresAt <= now
                  return (
                    <tr key={u.id}>
                      <td className="px-6 py-4 text-ink">{u.email}</td>
                      <td className="px-6 py-4 text-ink-soft">{u.name ?? '-'}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-4 text-ink-soft">
                        {u.isDisabled ? (
                          <span className="text-cedar-deep">Disabled</span>
                        ) : hasPendingInvite ? (
                          <span className="text-bronze">
                            Invite pending
                          </span>
                        ) : inviteExpired ? (
                          <span className="text-cedar-soft">Invite expired</span>
                        ) : u.passwordHash ? (
                          'Active'
                        ) : (
                          <span className="text-ink-muted">No password</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-ink-muted">
                        {u.lastSignInAt
                          ? u.lastSignInAt.toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!u.isDisabled && u.role !== 'CUSTOMER' ? (
                          <form action={disableUserAction} className="inline">
                            <input type="hidden" name="userId" value={u.id} />
                            <button
                              type="submit"
                              className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-cedar-deep"
                            >
                              Disable
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminPageBody>
    </>
  )
}

function RoleBadge({ role }: { role: keyof typeof ROLE_LABEL }) {
  const tone =
    role === 'ADMIN'
      ? 'bg-olive text-parchment'
      : role === 'STAFF'
        ? 'bg-bronze text-parchment'
        : 'bg-limestone-deep text-ink'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-eyebrow ${tone}`}
    >
      {ROLE_LABEL[role]}
    </span>
  )
}
