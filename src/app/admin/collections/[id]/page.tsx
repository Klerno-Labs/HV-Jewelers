import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { CollectionFormFields } from '../collection-form'
import { updateCollectionAction } from '../actions'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminCollectionEditPage({
  params,
  searchParams,
}: PageProps) {
  await requireStaffOrAdmin()
  const { id } = await params
  const sp = await searchParams
  const c = await prisma.collection.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!c) notFound()

  const banner =
    sp.saved || sp.created
      ? { kind: 'success' as const, message: 'Collection saved.' }
      : sp.error === 'invalid'
        ? { kind: 'error' as const, message: 'Please check the fields below.' }
        : sp.error === 'save'
          ? { kind: 'error' as const, message: 'Failed to save. See server logs.' }
          : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog · Collections"
        title={c.title}
        description={`Public URL: /collections/${c.slug} · ${c._count.products} product${c._count.products === 1 ? '' : 's'}`}
        actions={
          <Link
            href="/admin/collections"
            className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
          >
            ← All collections
          </Link>
        }
      />
      <AdminPageBody>
        {banner ? (
          <p
            role={banner.kind === 'error' ? 'alert' : 'status'}
            className={`mb-6 inline-block border-l py-3 pl-4 pr-6 text-caption ${
              banner.kind === 'error'
                ? 'border-cedar-deep bg-cedar/10 text-cedar-deep'
                : 'border-olive bg-olive/10 text-olive-deep'
            }`}
          >
            {banner.message}
          </p>
        ) : null}

        <form action={updateCollectionAction} className="space-y-8">
          <input type="hidden" name="id" value={c.id} />
          <CollectionFormFields
            defaults={{
              slug: c.slug,
              title: c.title,
              kind: c.kind,
              description: c.description,
              heroImagePublicId: c.heroImagePublicId,
              heroImageUrl: c.heroImageUrl,
              position: c.position,
              isPublished: c.isPublished,
              isFeatured: c.isFeatured,
              metaTitle: c.metaTitle,
              metaDescription: c.metaDescription,
            }}
          />
          <div className="flex items-center gap-3 border-t border-limestone-deep/60 pt-6">
            <button
              type="submit"
              className="inline-flex h-10 items-center bg-ink px-5 text-caption text-parchment hover:opacity-85"
            >
              Save changes
            </button>
            <Link
              href="/admin/collections"
              className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
            >
              Cancel
            </Link>
            <Link
              href={`/collections/${c.slug}`}
              className="ml-auto text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
            >
              View public page →
            </Link>
          </div>
        </form>
      </AdminPageBody>
    </>
  )
}
