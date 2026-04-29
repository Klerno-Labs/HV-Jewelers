import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { ProductFormFields } from '@/components/admin/product-form'
import { createProductAction } from '../actions'

export const metadata: Metadata = { title: 'New product — Admin' }

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Some fields are invalid. Check required fields and try again.',
  exists: 'A product with that slug already exists. Choose a different slug.',
}

export default async function AdminNewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaffOrAdmin()
  const sp = await searchParams
  const errorKey = typeof sp.error === 'string' ? sp.error : null

  const collections = await prisma.collection.findMany({
    where: { isPublished: true },
    orderBy: { position: 'asc' },
    select: { id: true, title: true },
  }).catch(() => [])

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog · Products"
        title="New product"
        description="Fill in core details and save as Draft. Images and inventory units can be added after saving."
        actions={
          <Link
            href="/admin/products"
            className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
          >
            ← Back to products
          </Link>
        }
      />
      <AdminPageBody>
        {errorKey ? (
          <p role="alert" className="mb-6 inline-block border-l border-cedar-deep bg-cedar/10 py-3 pl-4 pr-6 text-caption text-cedar-deep">
            {ERROR_MESSAGES[errorKey] ?? 'Something went wrong. Please try again.'}
          </p>
        ) : null}

        <form action={createProductAction} className="space-y-0">
          <ProductFormFields collections={collections} />

          <div className="mt-10 flex items-center gap-4 border-t border-limestone-deep/60 pt-8">
            <button
              type="submit"
              className="inline-flex h-10 items-center bg-ink px-6 text-eyebrow text-parchment transition-colors hover:bg-olive"
            >
              Create product
            </button>
            <Link
              href="/admin/products"
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
