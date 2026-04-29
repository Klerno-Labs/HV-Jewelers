import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
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
import { StatusPill } from '@/components/admin/status-pill'
import { ProductFormFields } from '@/components/admin/product-form'
import {
  updateProductAction,
  archiveProductAction,
  addProductImageAction,
  removeProductImageAction,
  setHeroImageAction,
  addInventoryUnitAction,
  removeInventoryUnitAction,
} from '../actions'

export const metadata: Metadata = { title: 'Edit product — Admin' }

const BANNERS: Record<string, { msg: string; tone: 'success' | 'error' }> = {
  created: { msg: 'Product created.', tone: 'success' },
  saved:   { msg: 'Changes saved.', tone: 'success' },
  archived: { msg: 'Product archived.', tone: 'success' },
  invalid: { msg: 'Some fields are invalid. Check required fields.', tone: 'error' },
  save:    { msg: 'Save failed. Please try again.', tone: 'error' },
  image:   { msg: 'Image fields are required.', tone: 'error' },
  sku:     { msg: 'That SKU already exists. Choose a different SKU or leave blank.', tone: 'error' },
  unit:    { msg: 'Only AVAILABLE units can be removed.', tone: 'error' },
}

export default async function AdminEditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaffOrAdmin()
  const { id } = await params
  const sp = await searchParams
  const flashKey = Object.keys(BANNERS).find((k) => sp[k])

  const [product, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        longDescription: true,
        era: true,
        status: true,
        isHidden: true,
        priceCents: true,
        compareAtCents: true,
        currency: true,
        materialsText: true,
        stonesText: true,
        dimensionsText: true,
        goldKarat: true,
        gramWeight: true,
        gramWeightVisible: true,
        ringSize: true,
        isResizable: true,
        resizeNotes: true,
        resizeVoidsReturn: true,
        stockMode: true,
        isReorderable: true,
        isFinalSale: true,
        returnWindowDays: true,
        signed: true,
        signedNotes: true,
        provenance: true,
        condition: true,
        conditionNotes: true,
        isFeatured: true,
        isNewArrival: true,
        shippingProfileId: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
        images: { orderBy: { position: 'asc' } },
        collections: {
          select: { collectionId: true },
        },
        materials: { select: { kind: true, notes: true } },
        stones: { select: { kind: true, caratWeight: true, count: true, notes: true } },
        inventoryItems: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            sku: true,
            internalRef: true,
            status: true,
            costCents: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.collection.findMany({
      where: { isPublished: true },
      orderBy: { position: 'asc' },
      select: { id: true, title: true },
    }).catch(() => []),
  ])

  if (!product) notFound()

  const defaults = {
    slug: product.slug,
    title: product.title,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    era: product.era,
    status: product.status,
    isHidden: product.isHidden,
    price: (product.priceCents / 100).toFixed(2),
    compareAt: product.compareAtCents != null ? (product.compareAtCents / 100).toFixed(2) : '',
    currency: product.currency,
    materialsText: product.materialsText,
    stonesText: product.stonesText,
    dimensionsText: product.dimensionsText,
    goldKarat: product.goldKarat,
    gramWeight: product.gramWeight ? Number(product.gramWeight) : null,
    gramWeightVisible: product.gramWeightVisible,
    ringSize: product.ringSize,
    isResizable: product.isResizable,
    resizeNotes: product.resizeNotes,
    resizeVoidsReturn: product.resizeVoidsReturn,
    stockMode: product.stockMode,
    isReorderable: product.isReorderable,
    isFinalSale: product.isFinalSale,
    returnWindowDays: product.returnWindowDays,
    signed: product.signed,
    signedNotes: product.signedNotes,
    provenance: product.provenance,
    condition: product.condition,
    conditionNotes: product.conditionNotes,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    shippingProfileId: product.shippingProfileId,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    collectionIds: product.collections.map((c) => c.collectionId),
    materials: product.materials.map((m) => ({ kind: m.kind, notes: m.notes ?? '' })),
    stones: product.stones.map((s) => ({
      kind: s.kind,
      caratWeight: s.caratWeight != null ? String(s.caratWeight) : '',
      count: s.count != null ? String(s.count) : '',
      notes: s.notes ?? '',
    })),
  }

  const banner = flashKey ? BANNERS[flashKey] : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog · Products"
        title={product.title}
        description={`${product.slug} · ${product.status}`}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
            >
              View live ↗
            </Link>
            <Link
              href="/admin/products"
              className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
            >
              ← All products
            </Link>
          </div>
        }
      />
      <AdminPageBody>
        {banner ? (
          <p
            role={banner.tone === 'error' ? 'alert' : 'status'}
            className={`mb-6 inline-block border-l py-3 pl-4 pr-6 text-caption ${
              banner.tone === 'error'
                ? 'border-cedar-deep bg-cedar/10 text-cedar-deep'
                : 'border-olive bg-olive/10 text-olive-deep'
            }`}
          >
            {banner.msg}
          </p>
        ) : null}

        {/* ── Main product form ── */}
        <form action={updateProductAction} className="space-y-0">
          <input type="hidden" name="id" value={product.id} />
          <ProductFormFields defaults={defaults} collections={collections} />
          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-limestone-deep/60 pt-8">
            <button
              type="submit"
              className="inline-flex h-10 items-center bg-ink px-6 text-eyebrow text-parchment transition-colors hover:bg-olive"
            >
              Save changes
            </button>
            {product.status !== 'ARCHIVED' && (
              <form action={archiveProductAction}>
                <input type="hidden" name="id" value={product.id} />
                <button
                  type="submit"
                  className="text-caption text-ink-muted underline underline-offset-4 decoration-bronze/40 hover:text-cedar-deep"
                >
                  Archive product
                </button>
              </form>
            )}
          </div>
        </form>

        {/* ── Images ── */}
        <section className="mt-16 border-t border-limestone-deep/60 pt-10">
          <h2 className="font-serif text-heading text-ink">Images</h2>
          <p className="mt-2 text-caption text-ink-muted">
            Add a Cloudinary public ID and URL. First image (position 0) is the listing thumbnail.
          </p>

          {product.images.length > 0 && (
            <AdminTable className="mt-6">
              <AdminTableHead>
                <tr>
                  <Th>URL</Th>
                  <Th align="right">Pos</Th>
                  <Th>Hero</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </AdminTableHead>
              <AdminTableBody>
                {product.images.map((img) => (
                  <tr key={img.id} className="hover:bg-limestone-deep/20">
                    <Td>
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-caption text-ink-soft underline underline-offset-2 decoration-bronze/40 hover:text-olive"
                      >
                        {img.cloudinaryPublicId}
                      </a>
                      {img.alt ? <div className="mt-0.5 text-caption text-ink-muted">{img.alt}</div> : null}
                    </Td>
                    <Td align="right" className="tabular-nums text-ink-muted">{img.position}</Td>
                    <Td>{img.isHero ? <span className="text-caption text-olive-deep">Hero</span> : null}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-3">
                        {!img.isHero && (
                          <form action={setHeroImageAction}>
                            <input type="hidden" name="imageId" value={img.id} />
                            <input type="hidden" name="productId" value={product.id} />
                            <button type="submit" className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive">
                              Set hero
                            </button>
                          </form>
                        )}
                        <form action={removeProductImageAction}>
                          <input type="hidden" name="imageId" value={img.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <button type="submit" className="text-caption text-ink-muted underline underline-offset-4 hover:text-cedar-deep">
                            Remove
                          </button>
                        </form>
                      </div>
                    </Td>
                  </tr>
                ))}
              </AdminTableBody>
            </AdminTable>
          )}

          <form action={addProductImageAction} className="mt-6 grid gap-4 border border-limestone-deep/60 bg-parchment p-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <input type="hidden" name="productId" value={product.id} />
            <div className="space-y-2">
              <label htmlFor="cloudinaryPublicId" className="block text-eyebrow text-ink-muted">Cloudinary public ID</label>
              <input id="cloudinaryPublicId" name="cloudinaryPublicId" type="text" required maxLength={256} className="block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink focus-visible:border-olive focus-visible:outline-none" />
            </div>
            <div className="space-y-2">
              <label htmlFor="img-url" className="block text-eyebrow text-ink-muted">URL</label>
              <input id="img-url" name="url" type="url" required maxLength={2048} className="block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink focus-visible:border-olive focus-visible:outline-none" />
            </div>
            <div className="space-y-2">
              <label htmlFor="img-alt" className="block text-eyebrow text-ink-muted">Alt text</label>
              <input id="img-alt" name="alt" type="text" maxLength={280} className="block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink focus-visible:border-olive focus-visible:outline-none" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="inline-flex h-10 items-center border border-ink px-4 text-eyebrow text-ink hover:border-olive hover:text-olive">
                Add image
              </button>
            </div>
          </form>
        </section>

        {/* ── Inventory units ── */}
        <section className="mt-16 border-t border-limestone-deep/60 pt-10">
          <h2 className="font-serif text-heading text-ink">Inventory units</h2>
          <p className="mt-2 text-caption text-ink-muted">
            Each row is one physical unit. Only AVAILABLE units can be removed.
          </p>

          <AdminTable className="mt-6">
            <AdminTableHead>
              <tr>
                <Th>SKU</Th>
                <Th>Ref</Th>
                <Th>Status</Th>
                <Th align="right">Cost</Th>
                <Th>Added</Th>
                <Th align="right">Actions</Th>
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {product.inventoryItems.length === 0 ? (
                <EmptyRow colSpan={6} message="No inventory units yet." />
              ) : (
                product.inventoryItems.map((unit) => (
                  <tr key={unit.id} className="hover:bg-limestone-deep/20">
                    <Td className="font-mono text-caption text-ink-soft">{unit.sku ?? '—'}</Td>
                    <Td className="font-mono text-caption text-ink-soft">{unit.internalRef ?? '—'}</Td>
                    <Td><StatusPill kind="inventory" value={unit.status} /></Td>
                    <Td align="right" className="tabular-nums text-ink-muted">
                      {unit.costCents != null ? `$${(unit.costCents / 100).toFixed(2)}` : '—'}
                    </Td>
                    <Td className="text-caption text-ink-muted">
                      {unit.createdAt.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' })}
                    </Td>
                    <Td align="right">
                      {unit.status === 'AVAILABLE' ? (
                        <form action={removeInventoryUnitAction}>
                          <input type="hidden" name="unitId" value={unit.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <button type="submit" className="text-caption text-ink-muted underline underline-offset-4 hover:text-cedar-deep">
                            Remove
                          </button>
                        </form>
                      ) : (
                        <span className="text-caption text-ink-muted">—</span>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </AdminTableBody>
          </AdminTable>

          <form action={addInventoryUnitAction} className="mt-6 grid gap-4 border border-limestone-deep/60 bg-parchment p-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <input type="hidden" name="productId" value={product.id} />
            <div className="space-y-2">
              <label htmlFor="inv-sku" className="block text-eyebrow text-ink-muted">SKU (optional)</label>
              <input id="inv-sku" name="sku" type="text" maxLength={64} className="block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink focus-visible:border-olive focus-visible:outline-none" />
            </div>
            <div className="space-y-2">
              <label htmlFor="inv-ref" className="block text-eyebrow text-ink-muted">Internal ref</label>
              <input id="inv-ref" name="internalRef" type="text" maxLength={140} className="block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink focus-visible:border-olive focus-visible:outline-none" />
            </div>
            <div className="space-y-2">
              <label htmlFor="inv-cost" className="block text-eyebrow text-ink-muted">Cost (USD)</label>
              <input id="inv-cost" name="cost" type="number" min="0" step="0.01" placeholder="0.00" className="block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink focus-visible:border-olive focus-visible:outline-none" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="inline-flex h-10 items-center border border-ink px-4 text-eyebrow text-ink hover:border-olive hover:text-olive">
                Add unit
              </button>
            </div>
          </form>
        </section>
      </AdminPageBody>
    </>
  )
}
