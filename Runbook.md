# HV Jewelers · Operator Runbook

A single document for the team operating the site day to day. Read it
once end-to-end when joining; keep it to hand for incidents.

---

## 1. Stack at a glance

| Layer       | Choice                                        |
| ----------- | --------------------------------------------- |
| Framework   | Next.js 15 App Router, TypeScript             |
| Styling     | Tailwind CSS v4 (custom `@theme` tokens)      |
| Database    | PostgreSQL, Prisma ORM                        |
| Auth        | Auth.js v5 (Credentials, JWT sessions)        |
| Payments    | Stripe Checkout (hosted) + webhooks           |
| Email       | Resend + React Email                          |
| Shipping    | Shippo (labels, tracking) — optional          |
| Images      | Cloudinary                                    |
| Hosting     | Vercel                                        |
| Rate limit  | Upstash Redis                                 |
| Crons       | cronjobs.org (Bearer-authed GET hits)         |

Source of truth for state:

- **Inventory:** `InventoryItem.status` (AVAILABLE / RESERVED / SOLD /
  HOLD / DAMAGED / RETURNED) + `InventoryLedger`.
- **Orders:** `Order.status` + `Order.paymentStatus` + `OrderEvent`.
- **Admin actions:** `AuditLog`.

---

## 2. Environment variables

Copy `.env.example` to `.env.local` for development. In production,
set these in Vercel (Settings → Environment Variables). **Never
commit `.env.local`.**

| Variable                                | Where to get it                               | Required |
| --------------------------------------- | --------------------------------------------- | -------- |
| `NEXT_PUBLIC_SITE_URL`                  | Your production URL                           | Yes      |
| `AUTH_SECRET`                           | `openssl rand -base64 32`                     | Yes      |
| `AUTH_URL`                              | Same as `NEXT_PUBLIC_SITE_URL`                | Yes      |
| `DATABASE_URL`                          | Neon / Supabase / RDS Postgres connection     | Yes      |
| `CLOUDINARY_CLOUD_NAME`                 | Cloudinary dashboard                          | Yes      |
| `CLOUDINARY_API_KEY` / `_API_SECRET`    | Cloudinary dashboard                          | Yes      |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`     | Same as above                                 | Yes      |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`     | Upstash Redis dashboard                       | Yes      |
| `STRIPE_SECRET_KEY`                     | Stripe → Developers → API keys                | Yes      |
| `STRIPE_WEBHOOK_SECRET`                 | Stripe → Developers → Webhooks                | Yes      |
| `STRIPE_TAX_ENABLED`                    | `"true"` after activating Stripe Tax          | Optional |
| `RESEND_API_KEY`                        | Resend dashboard                              | Yes      |
| `EMAIL_FROM_ADDRESS`                    | `Hoang Vi <concierge@hvjewelers.com>`          | Yes      |
| `EMAIL_REPLY_TO`                        | Optional custom reply-to                      | Optional |
| `SHIPPO_API_KEY`                        | Shippo → API → Tokens                         | Optional |
| `SELLER_SHIP_FROM_*` (5 fields)         | Your return address                           | For Shippo |
| `CRON_SECRET`                           | `openssl rand -base64 32`                     | Yes      |
| `NEXT_PUBLIC_SENTRY_DSN`                | Sentry project DSN                            | Optional |

If an optional integration isn't configured, the feature degrades
gracefully (no email sent, Shippo button hidden, etc.) — checkout
always works as long as the **Required** group is present.

---

## 3. First-time deploy

1. **Provision Postgres.** Neon free tier works. Copy the connection
   string with `?sslmode=require` into `DATABASE_URL`.
2. **Run migrations + seed.**
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
   Seed prints initial admin / staff credentials — save them and
   rotate on first sign-in.
3. **Create Stripe webhook.** In Stripe Dashboard → Developers →
   Webhooks, add an endpoint pointed at
   `https://<YOUR_HOST>/api/stripe/webhook`. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.expired`
   - `checkout.session.async_payment_failed`
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. **Set Resend DNS.** Verify your domain in Resend and add the
   SPF / DKIM TXT records to your DNS. Emails won't deliver
   reliably without this.
5. **Deploy.**
   ```bash
   vercel --prod
   ```
   Then go to cronjobs.org and register the three jobs from §7 against
   the production host (Bearer-authed with `CRON_SECRET`).
6. **Smoke test.**
   - `curl https://<YOUR_HOST>/api/healthz` → `{ ok: true, db: true }`
   - `/admin` → redirects to `/login`
   - Sign in → dashboard renders numeric counts
   - `/robots.txt` and `/sitemap.xml` return 200

---

## 4. Stripe setup

- **Test mode first.** Set `STRIPE_SECRET_KEY=sk_test_…` and run a
  card like `4242 4242 4242 4242`. Confirm the order flips to PAID
  in `/admin/orders` and the customer receives the confirmation
  email.
- **Go live.** Swap to `sk_live_…`, regenerate the webhook signing
  secret, and update `STRIPE_WEBHOOK_SECRET`.
- **Stripe Tax.** Activate in the Stripe dashboard first. Flip
  `STRIPE_TAX_ENABLED=true`. Test one order end-to-end before
  assuming it works in production.
- **Refunds.** Always issue from `/admin/orders/[id]` — never from
  the Stripe dashboard. Our flow updates our DB; dashboard refunds
  would leave `Order.totalRefundedCents` stale. The webhook for
  refunds (`charge.refunded`) is not yet wired; adding it would
  back-fill dashboard-initiated refunds.

---

## 5. Resend setup

1. Verify your sending domain in Resend.
2. Set `EMAIL_FROM_ADDRESS` to match the verified domain.
3. Templates live in `src/emails/`. Edit, then redeploy — no
   separate upload step.
4. To preview a template in dev, run `npx react-email dev` — a
   browser window opens with live-reloading previews.

When Resend is unconfigured, `sendOrderConfirmation` et al. log
`[email] skipped …` and exit. Stripe webhook still acks, so order
state stays consistent.

---

## 6. Shippo setup

1. Create a Shippo account. Use test mode (`shippo_test_…`) first.
2. Set the `SELLER_SHIP_FROM_*` fields to your real return address.
3. Generate a test label from `/admin/orders/[id]` (click **Generate
   label & ship**). Verify the label PDF opens and tracking populates.
4. Switch to `shippo_live_…` when ready.

When Shippo isn't configured, the admin still has manual tracking
entry under the same card.

---

## 7. Cron jobs

Configured in [cronjobs.org](https://cronjobs.org). Each job is set up
as a GET against the URL below with a custom header
`Authorization: Bearer ${CRON_SECRET}` so `isCronAuthorized` accepts it.

| Schedule     | Path                               | Purpose                                              |
| ------------ | ---------------------------------- | ---------------------------------------------------- |
| `*/5 * * * *` | `/api/cron/sweep-reservations`     | Release RESERVED items whose 30-min TTL expired.     |
| `15 * * * *`  | `/api/cron/sweep-pending-orders`   | Cancel PENDING orders older than 2 h, release stock. |
| `0 4 * * *`   | `/api/cron/prune-audit`            | Delete audit rows older than 365 d (730 d for auth). |

In cronjobs.org's UI: **Create cronjob → URL** is `https://<YOUR_HOST>/api/cron/<name>`,
**Schedule** uses the cron expression above, **Advanced → Custom HTTP
headers** holds the `Authorization: Bearer …` line. Enable
notifications on failure so a quiet sweep doesn't go unnoticed.

To manually invoke a cron in production:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  https://<YOUR_HOST>/api/cron/sweep-reservations
```

---

## 8. Staff training

New staff flow:

1. **Admin** opens `/admin/users/new`, enters email + role.
2. System emails a **one-time invite link** (48-hour TTL).
3. Recipient clicks the link, sets a password, signs in at `/admin`.

Daily operations for STAFF:

- **Check the dashboard.** Revenue, unfulfilled orders, low stock.
- **Pull unfulfilled orders.** Dashboard or `/admin/orders?status=PAID`.
- **Ship.** Order detail → "Generate label & ship" (Shippo) or
  manual entry. The customer receives a tracking email automatically.
- **Mark delivered** when carrier confirms. Starts the return-window
  clock on eligible lines.
- **Inventory.** `/admin/inventory` — bulk release reservations,
  place items on hold for photography, mark damaged.
- **Never issue refunds yourself** unless you're ADMIN. Flag a
  problem to the admin for processing.

ADMIN-only operations:

- Issue refunds (`/admin/orders/[id]` → refund form).
- Invite / disable staff (`/admin/users`).
- Reassign roles (re-invite with a different role).

---

## 9. Troubleshooting

### "Checkout says 'Sign-in temporarily unavailable'"

Upstash Redis is misconfigured or unreachable. Verify
`UPSTASH_REDIS_REST_URL` and `_TOKEN`. Check Upstash dashboard for
outages.

### "Order went PAID but customer didn't get an email"

1. Check `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` are set.
2. Check Resend dashboard → logs for the send attempt.
3. Verify SPF / DKIM on your sending domain (TXT records).
4. If Resend never fired, check server logs: the send failure is
   logged but doesn't block the webhook ack.

### "Refund failed — 'Stripe refused the refund'"

Most common cause: the order's `stripePaymentIntentId` is missing
or the payment never actually captured. Check the Stripe dashboard
for the payment intent; if Stripe says `succeeded`, retry the
refund. If Stripe says `requires_capture` or similar, that's an
unusual path — escalate to a developer.

### "Reservation stuck on a sold piece"

If `sweepExpiredReservations` hasn't fired or the cron is paused:

```bash
# Manual sweep
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  https://<YOUR_HOST>/api/cron/sweep-reservations
```

You can also release a specific item from `/admin/inventory` with
the **Release reservations** bulk action.

### "Shippo label generation failed"

Usual causes:
- Invalid ship-from address (check env vars).
- Address validation failure on the customer address. Check
  `/admin/orders/[id]` for the captured address; if it looks
  suspicious, email the customer to confirm.
- Shippo account balance depleted.

### "Admin user locked themselves out"

Can't happen through the UI (self-disable is blocked). If it
somehow occurred (direct DB edit):

```sql
UPDATE "User"
SET "isDisabled" = false
WHERE email = 'admin@example.com';
```

---

## 10. Backups

**Essential.** The Prisma schema is long-lived but data isn't.

- **Daily snapshots** of `DATABASE_URL` — configure through your
  Postgres host (Neon: Branches; Supabase: Point-in-time; RDS:
  automated snapshots).
- **Stripe** is its own source of truth for payment history. Our
  `Order` table is the merchant-side projection — if we ever need
  to reconcile, Stripe is authoritative.
- **Cloudinary** keeps product images. Exported `public_id`s are
  stored in `ProductImage`; retrievable from Cloudinary by id.
- **Email history** lives in Resend (30-day log default; export
  longer if required).

Restore drill: once per quarter, restore a snapshot into a staging
DB and run `/api/healthz` against it. Confirm orders, lines, and
audit rows load. A backup you haven't restored is a wish, not a
plan.

---

## 11. Security posture at a glance

- Sessions: httpOnly + Secure + SameSite Lax cookies. JWT-backed,
  24 h.
- Admin gates: middleware + re-check on every server render (the
  `/admin` layout re-reads the role from DB so disabled accounts
  lose access immediately).
- Refunds: ADMIN role only.
- Inputs: Zod at every boundary — storefront forms, admin
  mutations, cron routes, webhook payloads.
- CSP: strict `script-src` with per-request nonce + `strict-dynamic`.
  `style-src` allows inline `style=""` attributes (needed for
  `next/image`); `<style>` tags are still nonce-gated.
- Rate limiting: Upstash, 5 login attempts / 15 min per (IP + email).
- CSRF: Server actions + `form-action 'self'` CSP directive.
- Webhooks: Stripe signature verified against
  `STRIPE_WEBHOOK_SECRET`; cron endpoints gated by `CRON_SECRET`.
- Password hashing: bcryptjs, cost 12.
- Invite tokens: stored as SHA-256 hash; raw token only in email.

---

## 12. Quarterly hygiene

- Rotate `AUTH_SECRET` (invalidates all sessions — do this during
  a low-traffic window).
- Rotate `CRON_SECRET`.
- Verify backups restore cleanly.
- Audit `/admin/users` for dormant accounts; disable the ones no
  longer active.
- Confirm Resend SPF/DKIM still pass.
- Run `npm audit` and bump patch/minor dep versions.

---

*Maintainer note: keep this document one git commit behind the truth.
When behavior changes in `/lib/orders/*` or the cron routes, update
the Troubleshooting and Cron sections before you deploy.*
