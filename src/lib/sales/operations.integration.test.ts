import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import test from 'node:test'

const databaseUrl = process.env.TEST_DATABASE_URL

test(
  'paid-order export and retention operate through privacy boundaries',
  { skip: databaseUrl ? false : 'TEST_DATABASE_URL is not configured' },
  async () => {
    assert.ok(databaseUrl)
    const parsedDatabase = new URL(databaseUrl)
    assert.ok(
      ['127.0.0.1', 'localhost'].includes(parsedDatabase.hostname),
      'Integration tests require a local PostgreSQL host',
    )
    assert.match(
      parsedDatabase.pathname,
      /hv_sales_integration/,
      'Integration tests require a dedicated hv_sales_integration database',
    )

    process.env.DATABASE_URL = databaseUrl
    process.env.DIRECT_URL = databaseUrl
    process.env.SALES_MEASUREMENT_ENABLED = 'true'
    process.env.SALES_EXPORT_ENABLED = 'true'
    process.env.SALES_ANALYTICS_SALT =
      'integration-only-sales-analytics-salt-000000000000'
    process.env.SALES_EXPORT_TOKEN =
      'integration-only-sales-export-token-0000000000000'
    process.env.CRON_SECRET = 'integration-cron-secret-000000000000'

    const { prisma } = await import('@/lib/prisma')
    const { serverEnv } = await import('@/lib/env')
    const {
      hashSalesIdentifier,
      recordPaidOrder,
    } = await import('@/lib/sales/server')
    const { GET: exportSales } = await import(
      '@/app/api/sales-export/route'
    )
    const { GET: pruneEvidence } = await import(
      '@/app/api/cron/prune-audit/route'
    )

    const daysAgo = (days: number) =>
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    await prisma.checkoutAttribution.deleteMany()
    await prisma.salesEvent.deleteMany()
    await prisma.auditLog.deleteMany()

    const sessionHash = hashSalesIdentifier('integration-session')
    const cartHash = hashSalesIdentifier('integration-cart')
    await prisma.salesEvent.create({
      data: {
        id: 'integration-first-touch',
        eventType: 'site_visit',
        sessionHash,
        source: 'google',
        medium: 'organic',
        campaign: 'integration-check',
        evidenceSource: 'integration-test',
      },
    })
    await prisma.checkoutAttribution.create({
      data: {
        cartHash,
        sessionHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const unsafeOrder = {
      id: 987654,
      cart_token: 'integration-cart',
      current_total_price: '1200.00',
      currency: 'USD',
      email: 'synthetic.customer@example.test',
      billing_address: { address1: 'Never persist' },
      payment_gateway_names: ['synthetic-card'],
      line_items: [
        {
          product_id: 10,
          variant_id: 11,
          quantity: 2,
          price: '600.00',
          name: 'Never persist display text',
        },
      ],
    }
    assert.deepEqual(await recordPaidOrder(unsafeOrder, 'integration-webhook'), {
      recorded: true,
      attributed: true,
    })
    assert.deepEqual(await recordPaidOrder(unsafeOrder, 'integration-webhook'), {
      recorded: false,
      attributed: true,
    })

    await prisma.salesEvent.createMany({
      data: [
        {
          id: 'integration-sales-expired',
          eventType: 'site_visit',
          sessionHash: 'expired-session-hash',
          evidenceSource: 'integration-test',
          createdAt: daysAgo(181),
        },
        {
          id: 'integration-sales-retained',
          eventType: 'site_visit',
          sessionHash: 'retained-session-hash',
          evidenceSource: 'integration-test',
          createdAt: daysAgo(179),
        },
      ],
    })
    await prisma.checkoutAttribution.create({
      data: {
        cartHash: 'expired-cart-hash',
        sessionHash: 'expired-attribution-session',
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    })
    await prisma.auditLog.createMany({
      data: [
        {
          id: 'integration-general-expired',
          action: 'order.ship',
          resourceType: 'Order',
          createdAt: daysAgo(366),
        },
        {
          id: 'integration-general-retained',
          action: 'order.ship',
          resourceType: 'Order',
          createdAt: daysAgo(364),
        },
        {
          id: 'integration-auth-expired',
          action: 'auth.signin.success',
          resourceType: 'User',
          createdAt: daysAgo(731),
        },
        {
          id: 'integration-auth-retained',
          action: 'auth.signin.success',
          resourceType: 'User',
          createdAt: daysAgo(729),
        },
      ],
    })

    const unauthorizedPrune = await pruneEvidence(
      new Request('https://preview.invalid/api/cron/prune-audit'),
    )
    assert.equal(unauthorizedPrune.status, 401)

    const pruneResponse = await pruneEvidence(
      new Request('https://preview.invalid/api/cron/prune-audit', {
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }),
    )
    assert.equal(pruneResponse.status, 200)
    assert.deepEqual(await pruneResponse.json(), {
      ok: true,
      generalDeleted: 1,
      authDeleted: 1,
      salesDeleted: 1,
      attributionsDeleted: 1,
    })

    assert.equal(
      await prisma.salesEvent.count({
        where: { id: 'integration-sales-retained' },
      }),
      1,
    )
    assert.equal(
      await prisma.auditLog.count({
        where: {
          id: {
            in: ['integration-general-retained', 'integration-auth-retained'],
          },
        },
      }),
      2,
    )

    serverEnv.SALES_EXPORT_ENABLED = 'false'
    const disabledExport = await exportSales(
      new Request('https://preview.invalid/api/sales-export', {
        headers: {
          authorization: `Bearer ${process.env.SALES_EXPORT_TOKEN}`,
        },
      }),
    )
    assert.equal(disabledExport.status, 503)
    serverEnv.SALES_EXPORT_ENABLED = 'true'

    const unauthorizedExport = await exportSales(
      new Request('https://preview.invalid/api/sales-export'),
    )
    assert.equal(unauthorizedExport.status, 401)

    const exportResponse = await exportSales(
      new Request('https://preview.invalid/api/sales-export?days=31', {
        headers: {
          authorization: `Bearer ${process.env.SALES_EXPORT_TOKEN}`,
        },
      }),
    )
    assert.equal(exportResponse.status, 200)
    assert.equal(exportResponse.headers.get('cache-control'), 'private, no-store')
    assert.equal(exportResponse.headers.get('x-content-type-options'), 'nosniff')

    const exported = (await exportResponse.json()) as Array<{
      event_type: string
      properties: { order_key?: string; quantity?: number }
      [key: string]: unknown
    }>
    const purchase = exported.find((item) => item.event_type === 'purchase')
    const purchaseItem = exported.find(
      (item) => item.event_type === 'purchase_item',
    )
    assert.ok(purchase)
    assert.ok(purchaseItem)
    assert.equal(purchaseItem.properties.quantity, 2)
    assert.match(purchase.properties.order_key ?? '', /^[a-f0-9]{64}$/)
    assert.equal(
      purchase.properties.order_key,
      purchaseItem.properties.order_key,
    )

    const serialized = JSON.stringify(exported)
    assert.equal(serialized.includes('synthetic.customer@example.test'), false)
    assert.equal(serialized.includes('Never persist'), false)
    assert.equal(serialized.includes('integration-webhook'), false)
    assert.equal(serialized.includes('integration-cart'), false)
    assert.equal(serialized.includes('expired-session-hash'), false)

    const exportPath = process.env.SALES_INTEGRATION_EXPORT_PATH
    if (exportPath) {
      await writeFile(exportPath, `${JSON.stringify(exported, null, 2)}\n`)
    }

    await prisma.$disconnect()
  },
)
