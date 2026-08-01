import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clientSalesEventSchema,
  normalizeAttributionToken,
  paidOrderSchema,
  safeMoney,
  storefrontCartToken,
} from './contracts'

test('client event contract rejects extra customer data', () => {
  const result = clientSalesEventSchema.safeParse({
    eventType: 'site_visit',
    sessionId: 'c6c09319-e446-4d14-96bd-fdbd92f1a3b2',
    source: 'google',
    medium: 'organic',
    campaign: 'none',
    email: 'customer@example.com',
  })
  assert.equal(result.success, false)
})

test('product interactions require a product identifier', () => {
  const result = clientSalesEventSchema.safeParse({
    eventType: 'add_to_cart',
    sessionId: 'c6c09319-e446-4d14-96bd-fdbd92f1a3b2',
  })
  assert.equal(result.success, false)
})

test('client contract rejects customer-like text and malformed Shopify IDs', () => {
  assert.equal(
    clientSalesEventSchema.safeParse({
      eventType: 'product_view',
      sessionId: '00000000-0000-4000-8000-000000000000',
      productId: 'customer@example.com',
      campaign: 'customer@example.com',
    }).success,
    false,
  )
  assert.equal(normalizeAttributionToken('customer@example.com'), '')
  assert.equal(normalizeAttributionToken('Summer Launch 2026'), 'summer-launch-2026')
})

test('paid order reduction strips customer and payment fields', () => {
  const safe = paidOrderSchema.parse({
    id: 123,
    cart_token: 'cart-token',
    current_total_price: '1200.00',
    currency: 'USD',
    email: 'customer@example.com',
    billing_address: { address1: 'Never persist' },
    payment_gateway_names: ['card'],
    line_items: [
      {
        product_id: 10,
        variant_id: 11,
        quantity: 1,
        price: '1200.00',
        name: 'Customer-linked display text',
      },
    ],
  })
  const serialized = JSON.stringify(safe)
  assert.equal(serialized.includes('customer@example.com'), false)
  assert.equal(serialized.includes('billing_address'), false)
  assert.equal(serialized.includes('payment_gateway_names'), false)
  assert.equal(safe.line_items[0]?.quantity, 1)
  assert.deepEqual(Object.keys(safe.line_items[0] ?? {}).sort(), [
    'price',
    'product_id',
    'quantity',
    'variant_id',
  ])
})

test('storefront cart IDs reduce to the webhook cart token', () => {
  assert.equal(
    storefrontCartToken('gid://shopify/Cart/abc123?key=private'),
    'abc123',
  )
})

test('money parsing fails closed', () => {
  assert.equal(safeMoney('12.345'), 12.35)
  assert.equal(safeMoney('-5'), 0)
  assert.equal(safeMoney('not-money'), 0)
})
