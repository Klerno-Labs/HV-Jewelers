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
import {
  reorderHomepageSectionAction,
  togglePublishHomepageSectionAction,
} from './actions'

const TYPE_LABELS: Record<string, string> = {
  HERO: 'Hero',
  EDITORIAL_HIGHLIGHT: 'Editorial highlight',
  FEATURED_COLLECTION: 'Featured collection',
  NEW_ARRIVALS_GRID: 'New arrivals grid',
  TWO_UP: 'Two-up',
  PRESS_QUOTE: 'Press quote',
  CTA_BAND: 'CTA band',
}

const BANNERS: Record<string, string> = {
  moved: 'Order updated.',
  published: 'Section published.',
  unpublished: 'Section unpublished.',
  at_edge: 'Already at the edge. No further movement possible.',
}

export default async function AdminHomepagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaffOrAdmin()
  const sp = await searchParams

  const sections = await prisma.homepageSection.findMany({
    orderBy: { position: 'asc' },
  })

  const flash = Object.keys(BANNERS).find((k) => sp[k])

  return (
    <>
      <AdminPageHeader
        eyebrow="Editorial"
        title="Homepage"
        description="Composable sections rendered from top to bottom in the order shown. Per-type editing lives in a later phase; reorder and publish are live."
      />
      <AdminPageBody>
        {flash ? (
          <p
            role={flash === 'at_edge' ? 'alert' : 'status'}
            className={`mb-6 inline-block border-l py-3 pl-4 pr-6 text-caption ${
              flash === 'at_edge'
                ? 'border-cedar-deep bg-cedar/10 text-cedar-deep'
                : 'border-olive bg-olive/10 text-olive-deep'
            }`}
          >
            {BANNERS[flash]}
          </p>
        ) : null}

        <AdminTable>
          <AdminTableHead>
            <tr>
              <Th align="right" className="w-16">
                Pos
              </Th>
              <Th>Type</Th>
              <Th>Title / subtitle</Th>
              <Th>Published</Th>
              <Th align="right">Actions</Th>
            </tr>
          </AdminTableHead>
          <AdminTableBody>
            {sections.length === 0 ? (
              <EmptyRow
                colSpan={5}
                message="No homepage sections yet. The seed inserts three by default."
              />
            ) : (
              sections.map((s) => (
                <tr key={s.id} className="hover:bg-limestone-deep/20">
                  <Td align="right" className="tabular-nums text-ink-muted">
                    {s.position}
                  </Td>
                  <Td className="font-serif text-title text-ink">
                    {TYPE_LABELS[s.type] ?? s.type}
                  </Td>
                  <Td>
                    <div className="text-ink">{s.title ?? '-'}</div>
                    {s.subtitle ? (
                      <div className="mt-1 text-caption text-ink-muted">
                        {s.subtitle}
                      </div>
                    ) : null}
                  </Td>
                  <Td>
                    {s.isPublished ? (
                      <span className="text-caption text-olive-deep">Live</span>
                    ) : (
                      <span className="text-caption text-ink-muted">Draft</span>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-3">
                      <form action={reorderHomepageSectionAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          aria-label="Move up"
                          className="text-caption text-ink-soft hover:text-olive"
                        >
                          ↑
                        </button>
                      </form>
                      <form action={reorderHomepageSectionAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          aria-label="Move down"
                          className="text-caption text-ink-soft hover:text-olive"
                        >
                          ↓
                        </button>
                      </form>
                      <form action={togglePublishHomepageSectionAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input
                          type="hidden"
                          name="publish"
                          value={s.isPublished ? '0' : '1'}
                        />
                        <button
                          type="submit"
                          className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
                        >
                          {s.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </AdminTableBody>
        </AdminTable>

        <p className="mt-6 text-caption text-ink-muted">
          Note: section `data` payloads (hero copy, product slugs, CTAs) are
          still edited via seed / DB today. A type-specific editor lands in
          a later phase alongside image uploads.
        </p>
      </AdminPageBody>
    </>
  )
}
