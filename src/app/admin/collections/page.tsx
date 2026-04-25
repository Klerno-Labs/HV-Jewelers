import Link from 'next/link'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  EmptyRow,
  Td,
  Th,
} from '@/components/admin/data-table'
import { togglePublishCollectionAction } from './actions'

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaffOrAdmin()
  const sp = await searchParams
  const collections = await prisma.collection.findMany({
    orderBy: [{ position: 'asc' }, { title: 'asc' }],
    include: { _count: { select: { products: true } } },
  })

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Collections"
        description="Editorial worlds: Archive, Near Vintage, Fine, Gold, Pearls, New Arrivals, plus curated edits."
        actions={
          <Link
            href="/admin/collections/new"
            className="inline-flex h-9 items-center bg-ink px-4 text-eyebrow text-parchment hover:opacity-85"
          >
            New collection
          </Link>
        }
      />
      <AdminPageBody>
        {sp.toggled ? (
          <p
            role="status"
            className="mb-6 inline-block border-l border-olive bg-olive/10 py-3 pl-4 pr-6 text-caption text-olive-deep"
          >
            Collection publish state updated.
          </p>
        ) : null}

        <AdminTable>
          <AdminTableHead>
            <tr>
              <Th>Title</Th>
              <Th>Slug</Th>
              <Th>Kind</Th>
              <Th align="right">Products</Th>
              <Th align="right">Position</Th>
              <Th>Published</Th>
              <Th align="right">Actions</Th>
            </tr>
          </AdminTableHead>
          <AdminTableBody>
            {collections.length === 0 ? (
              <EmptyRow
                colSpan={7}
                message="No collections yet. Create the first editorial world."
              />
            ) : (
              collections.map((c) => (
                <tr key={c.id} className="hover:bg-limestone-deep/20">
                  <Td>
                    <Link
                      href={`/admin/collections/${c.id}`}
                      className="font-serif text-title text-ink transition-colors hover:text-olive"
                    >
                      {c.title}
                    </Link>
                  </Td>
                  <Td>
                    <span className="font-mono text-caption text-ink-muted">
                      {c.slug}
                    </span>
                  </Td>
                  <Td className="text-ink-soft">{c.kind.replace(/_/g, ' ')}</Td>
                  <Td align="right" className="tabular-nums text-ink">
                    {c._count.products}
                  </Td>
                  <Td align="right" className="tabular-nums text-ink-muted">
                    {c.position}
                  </Td>
                  <Td>
                    {c.isPublished ? (
                      <span className="text-caption text-olive-deep">Live</span>
                    ) : (
                      <span className="text-caption text-ink-muted">Draft</span>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-3">
                      <form action={togglePublishCollectionAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input
                          type="hidden"
                          name="publish"
                          value={c.isPublished ? '0' : '1'}
                        />
                        <button
                          type="submit"
                          className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                        >
                          {c.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </form>
                      <Link
                        href={`/collections/${c.slug}`}
                        className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/collections/${c.id}`}
                        className="text-caption text-ink underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
                      >
                        Edit
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </AdminTableBody>
        </AdminTable>
      </AdminPageBody>
    </>
  )
}
