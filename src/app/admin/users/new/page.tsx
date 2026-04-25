import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth-helpers'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import {
  FormField,
  Select,
  TextInput,
} from '@/components/admin/form-fields'
import { inviteStaffAction } from '../actions'

export const metadata: Metadata = {
  title: 'Invite staff',
  robots: { index: false, follow: false },
}

export default async function InviteStaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams
  const error = sp.error === 'invalid'
    ? 'Please check the fields. Email and role are required.'
    : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Settings · Users"
        title="Invite staff"
        description="Sends a one-time link to the address below. The recipient sets their own password on first sign-in."
        actions={
          <Link
            href="/admin/users"
            className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
          >
            ← All users
          </Link>
        }
      />
      <AdminPageBody>
        {error ? (
          <p
            role="alert"
            className="mb-6 inline-block border-l border-cedar-deep bg-cedar/10 py-3 pl-4 pr-6 text-caption text-cedar-deep"
          >
            {error}
          </p>
        ) : null}

        <form action={inviteStaffAction} className="max-w-xl space-y-8">
          <FormField id="email" label="Email">
            <TextInput
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              placeholder="name@example.com"
            />
          </FormField>

          <FormField id="name" label="Name (optional)">
            <TextInput id="name" name="name" maxLength={140} />
          </FormField>

          <FormField
            id="role"
            label="Role"
            hint="Admins can invite more users and issue refunds. Staff can ship, manage inventory, and edit content."
          >
            <Select
              id="role"
              name="role"
              defaultValue="STAFF"
              options={[
                { value: 'STAFF', label: 'Staff' },
                { value: 'ADMIN', label: 'Administrator' },
              ]}
            />
          </FormField>

          <div className="flex items-center gap-3 border-t border-limestone-deep/60 pt-6">
            <button
              type="submit"
              className="inline-flex h-10 items-center bg-ink px-5 text-caption text-parchment hover:opacity-85"
            >
              Send invite
            </button>
            <Link
              href="/admin/users"
              className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
            >
              Cancel
            </Link>
          </div>
        </form>
      </AdminPageBody>
    </>
  )
}
