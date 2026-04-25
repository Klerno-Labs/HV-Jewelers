import { type NextRequest } from 'next/server'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { buildCsv, csvResponse } from '@/lib/admin/csv'
import {
  inventoryWhereFromFilters,
  parseInventoryFilters,
} from '@/lib/admin/query'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  await requireStaffOrAdmin()

  const sp: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((v, k) => {
    sp[k] = v
  })
  const filters = parseInventoryFilters(sp)
  const where = inventoryWhereFromFilters(filters)

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      product: {
        select: {
          title: true,
          slug: true,
          era: true,
          priceCents: true,
          currency: true,
        },
      },
    },
  })

  const headers = [
    'SKU',
    'Internal ref',
    'Product title',
    'Product slug',
    'Era',
    'Status',
    'Price cents',
    'Cost cents',
    'Reserved cart id',
    'Reserved expires',
    'Sold at',
    'Created at',
  ]

  const rows = items.map((i) => [
    i.sku ?? '',
    i.internalRef ?? '',
    i.product.title,
    i.product.slug,
    i.product.era,
    i.status,
    i.product.priceCents,
    i.costCents ?? '',
    i.reservedCartId ?? '',
    i.reservedExpiresAt?.toISOString() ?? '',
    i.soldAt?.toISOString() ?? '',
    i.createdAt.toISOString(),
  ])

  const csv = buildCsv(headers, rows)
  const stamp = new Date().toISOString().slice(0, 10)
  return csvResponse(csv, `hv-inventory-${stamp}.csv`)
}
