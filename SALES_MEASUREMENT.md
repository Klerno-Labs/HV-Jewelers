# HV Sales Measurement Bridge

## State

This is a local, review-only implementation. It is disabled by default and has
not been deployed, connected to production credentials, or used with customer
data.

## What it measures

- Existing visits, product views, gallery use, shop filters, add-to-bag,
  bag-open, newsletter, concierge-email, and checkout-start actions.
- Verified `orders/paid` totals and product lines from HMAC-verified Shopify
  webhooks.
- First-touch source, medium, and campaign tokens for aggregate comparison.

The bridge does not add promotional UI or change checkout. It establishes a
baseline before any sales experiment changes the customer experience.

## Privacy boundary

- The browser sends a random session UUID and constrained Shopify identifiers.
- The server stores one-way HMAC hashes, never the raw session, cart token, or
  order ID.
- Shopify customer, address, payment, order-name, and line-item display fields
  are removed before persistence.
- Email-shaped attribution text and malformed Shopify identifiers are rejected.
- Browser Do Not Track disables client event collection.
- Checkout attribution expires after 30 days. Pseudonymous sales events are
  deleted after 180 days by the existing authenticated retention job.
- The privacy page discloses this behavior before production enablement.

## Production controls

Collection remains off unless `SALES_MEASUREMENT_ENABLED=true` and a
`SALES_ANALYTICS_SALT` of at least 32 characters are both present. Browser
funnel events additionally require
`NEXT_PUBLIC_SALES_MEASUREMENT_ENABLED=true`. The export endpoint requires an
independent bearer token in `SALES_EXPORT_TOKEN` and returns no customer fields.

## Deployment gate

Deployment requires a new explicit approval. The approved local-build scope
does not authorize these actions.

1. Review this patch, privacy language, data retention, and processor terms.
2. Apply the Prisma migration to a non-production database and run a rollback
   rehearsal.
3. Generate independent production values for the analytics salt and export
   token; do not reuse authentication or Shopify secrets.
4. Configure an `orders/paid` JSON webhook to `/api/shopify/webhook` and verify
   HMAC signatures and webhook-ID deduplication in preview.
5. Enable server measurement first, verify unattributed order recording, then
   enable browser measurement for a staged baseline.
6. Confirm the daily retention job deletes expired attribution links and events
   older than 180 days.
7. Export the first privacy-screened baseline into Indy with an actual-source
   attestation. Do not launch an experiment until its separate approval exists.

## Rollback

Set both measurement flags to `false`, remove the `orders/paid` webhook, and
redeploy. The endpoints then stop accepting or exporting measurement data. The
new tables can remain dormant for audit review and be deleted later under an
approved data-removal change.

## Verification

- Six sales contract tests pass.
- TypeScript type checking passes.
- Prisma schema validation passes.
- The optimized Next.js production build passes.
- The production dependency audit reports zero known vulnerabilities.
- One low-severity development-only `esbuild` advisory remains for a Windows
  development-server path; it is absent from the production dependency audit.

## Known limitation

Shopify paid-order webhooks provide verified revenue, not product cost. Gross
margin remains unknown until a separate non-customer product-cost mapping is
approved and imported. Indy must not estimate margin and label it actual.
