import Link from 'next/link'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { CollectionFormFields } from '../collection-form'
import { createCollectionAction } from '../actions'

export default async function AdminCollectionNewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaffOrAdmin()
  const sp = await searchParams
  const error =
    sp.error === 'invalid'
      ? 'Please check the fields below. Some values are invalid.'
      : sp.error === 'exists'
        ? 'A collection with that slug already exists.'
        : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog · Collections"
        title="New collection"
        description="Editorial worlds are the spine of the storefront. The slug becomes the public URL."
        actions={
          <Link
            href="/admin/collections"
            className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
          >
            ← Back to list
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
        <form action={createCollectionAction} className="space-y-8">
          <CollectionFormFields defaults={{}} />
          <div className="flex items-center gap-3 border-t border-limestone-deep/60 pt-6">
            <button
              type="submit"
              className="inline-flex h-10 items-center bg-ink px-5 text-caption text-parchment hover:opacity-85"
            >
              Create collection
            </button>
            <Link
              href="/admin/collections"
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
