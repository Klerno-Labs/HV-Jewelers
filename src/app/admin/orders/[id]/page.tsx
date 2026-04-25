import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { StatusPill } from '@/components/admin/status-pill'
import {
  FormField,
  Select,
  TextInput,
  Textarea,
} from '@/components/admin/form-fields'
import { Price } from '@/components/store/price'
import { ERA_LABELS } from '@/lib/products/eras'
import { isShippoConfigured } from '@/lib/shipping/shippo'
import {
  deliverOrderAction,
  generateLabelAction,
  refundOrderAction,
  shipOrderAction,
  updateNoteAction,
} from './actions'

export const metadata: Metadata = {
  title: 'Order',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function loadOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      lines: true,
      events: {
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { email: true, role: true } } },
      },
      user: { select: { email: true, name: true, role: true } },
    },
  })
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { user: admin } = await requireStaffOrAdmin()
  const { id } = await params
  const sp = await searchParams
  const order = await loadOrder(id)
  if (!order) notFound()

  const remainingCents = Math.max(0, order.totalCents - order.totalRefundedCents)
  const canShip = order.status === 'PAID'
  const canDeliver = order.status === 'SHIPPED'
  const canRefund =
    (order.paymentStatus === 'CAPTURED' ||
      order.paymentStatus === 'PARTIALLY_REFUNDED') &&
    remainingCents > 0 &&
    admin.role === 'ADMIN'

  const flash = buildFlash(sp)

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations · Orders"
        title={order.orderNumber}
        description={`Placed ${order.createdAt.toLocaleString('en-US')} · ${order.email || 'no email'}`}
        actions={
          <Link
            href="/admin/orders"
            className="text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
          >
            ← All orders
          </Link>
        }
      />
      <AdminPageBody>
        {flash ? <Flash kind={flash.kind} message={flash.message} /> : null}

        {/* ─── Status row ─── */}
        <section className="grid gap-4 border border-limestone-deep/60 bg-parchment p-6 sm:grid-cols-3">
          <PillRow label="Order status">
            <StatusPill kind="order" value={order.status} />
          </PillRow>
          <PillRow label="Payment">
            <StatusPill kind="payment" value={order.paymentStatus} />
          </PillRow>
          <PillRow label="Fulfillment">
            <StatusPill kind="fulfillment" value={order.fulfillmentStatus} />
          </PillRow>
        </section>

        {/* ─── Totals + Address ─── */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <section className="border border-limestone-deep/60 bg-parchment">
            <div className="border-b border-limestone-deep/60 px-6 py-4">
              <p className="text-eyebrow text-ink-muted">Lines</p>
            </div>
            <ul className="divide-y divide-limestone-deep/40">
              {order.lines.map((line) => (
                <li key={line.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-eyebrow text-ink-muted">
                        {ERA_LABELS[line.productEra]}
                      </p>
                      <p className="mt-1 font-serif text-title text-ink">
                        <Link
                          href={`/products/${line.productSlug}`}
                          className="transition-colors hover:text-olive"
                        >
                          {line.productTitle}
                        </Link>
                      </p>
                      <p className="mt-2 text-caption text-ink-muted">
                        Qty {line.quantity}
                        {line.policyFinalSale ? ' · Final sale' : ''}
                        {line.resizingRequested ? ' · Resizing requested' : ''}
                      </p>
                    </div>
                    <Price
                      cents={line.totalCents}
                      currency={order.currency}
                      className="tabular-nums text-caption text-ink"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-limestone-deep/60 px-6 py-5">
              <dl className="space-y-2 text-caption">
                <TotalRow label="Subtotal" cents={order.subtotalCents} currency={order.currency} />
                <TotalRow label="Shipping" cents={order.shippingCents} currency={order.currency} />
                {order.discountCents > 0 ? (
                  <TotalRow label="Discount" cents={-order.discountCents} currency={order.currency} />
                ) : null}
                {order.taxCents > 0 ? (
                  <TotalRow label="Tax" cents={order.taxCents} currency={order.currency} />
                ) : null}
                <div className="flex justify-between border-t border-limestone-deep/40 pt-3 text-body text-ink">
                  <dt>Total</dt>
                  <dd className="tabular-nums">
                    <Price cents={order.totalCents} currency={order.currency} />
                  </dd>
                </div>
                {order.totalRefundedCents > 0 ? (
                  <div className="flex justify-between text-cedar-deep">
                    <dt>Refunded</dt>
                    <dd className="tabular-nums">
                      <Price cents={-order.totalRefundedCents} currency={order.currency} />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="border border-limestone-deep/60 bg-parchment p-6">
              <p className="text-eyebrow text-ink-muted">Ship to</p>
              {order.shipLine1 ? (
                <address className="mt-4 not-italic text-body leading-relaxed text-ink">
                  {order.shipName}
                  <br />
                  {order.shipLine1}
                  {order.shipLine2 ? (
                    <>
                      <br />
                      {order.shipLine2}
                    </>
                  ) : null}
                  <br />
                  {order.shipCity}, {order.shipRegion} {order.shipPostalCode}
                  <br />
                  {order.shipCountry}
                  {order.shipPhone ? (
                    <>
                      <br />
                      <span className="text-caption text-ink-muted">
                        {order.shipPhone}
                      </span>
                    </>
                  ) : null}
                </address>
              ) : (
                <p className="mt-4 text-body text-ink-muted">
                  Not captured yet. Address is filled in when Stripe
                  reports payment success.
                </p>
              )}
              {order.carrier || order.trackingNumber ? (
                <div className="mt-6 border-t border-limestone-deep/60 pt-4">
                  <p className="text-eyebrow text-ink-muted">Carrier</p>
                  <p className="mt-2 text-body text-ink">
                    {order.carrier ?? '-'}
                  </p>
                  {order.trackingNumber ? (
                    <p className="mt-1 font-mono text-caption text-ink-muted">
                      {order.trackingNumber}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {order.signatureRequired ? (
                <p className="mt-4 inline-flex items-center gap-2 text-caption text-murex-purple">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-murex-purple"
                  />
                  Signature required on delivery.
                </p>
              ) : null}
            </section>

            <section className="border border-limestone-deep/60 bg-parchment p-6">
              <p className="text-eyebrow text-ink-muted">Customer</p>
              <p className="mt-3 font-mono text-caption text-ink">{order.email || '-'}</p>
              {order.user ? (
                <p className="mt-1 text-caption text-ink-muted">
                  Account: {order.user.email} · {order.user.role}
                </p>
              ) : (
                <p className="mt-1 text-caption text-ink-muted">Guest checkout</p>
              )}
            </section>
          </aside>
        </div>

        {/* ─── Actions ─── */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {canShip ? (
            <ShipForm orderId={order.id} shippoEnabled={isShippoConfigured()} />
          ) : null}
          {canDeliver ? <DeliverForm orderId={order.id} /> : null}
          {canRefund ? (
            <RefundForm
              orderId={order.id}
              remainingCents={remainingCents}
              currency={order.currency}
            />
          ) : null}
          <NoteForm orderId={order.id} note={order.internalNote ?? ''} />
        </section>

        {/* ─── Timeline ─── */}
        <section className="mt-10">
          <p className="text-eyebrow text-ink-muted">Timeline</p>
          {order.events.length === 0 ? (
            <p className="mt-4 text-caption text-ink-muted">
              No events yet. Fulfillment actions will record here.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-greek-terracotta/20 border-y border-greek-terracotta/25 bg-parchment">
              {order.events.map((ev) => (
                <li key={ev.id} className="relative px-5 py-4 pl-9 text-caption">
                  <span
                    aria-hidden
                    className="absolute left-3.5 top-[1.35rem] inline-block h-2 w-2 rounded-full bg-murex-purple"
                  />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-ink">{ev.type}</span>
                    <time
                      dateTime={ev.createdAt.toISOString()}
                      className="text-ink-muted"
                    >
                      {ev.createdAt.toLocaleString('en-US')}
                    </time>
                  </div>
                  {ev.description ? (
                    <p className="mt-2 text-ink-soft">{ev.description}</p>
                  ) : null}
                  {ev.actor ? (
                    <p className="mt-1 text-ink-muted">
                      By {ev.actor.email} · {ev.actor.role}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </AdminPageBody>
    </>
  )
}

function PillRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-eyebrow text-ink-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function TotalRow({
  label,
  cents,
  currency,
}: {
  label: string
  cents: number
  currency: string
}) {
  return (
    <div className="flex justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd className="tabular-nums">
        <Price cents={cents} currency={currency} />
      </dd>
    </div>
  )
}

function ShipForm({
  orderId,
  shippoEnabled,
}: {
  orderId: string
  shippoEnabled: boolean
}) {
  return (
    <div className="border border-limestone-deep/60 bg-parchment p-6">
      <p className="text-eyebrow text-bronze">Ship this order</p>

      {shippoEnabled ? (
        <form action={generateLabelAction} className="mt-4">
          <input type="hidden" name="orderId" value={orderId} />
          <p className="mb-4 text-caption leading-relaxed text-ink-soft">
            Generate a carrier label automatically via Shippo. We pick the
            cheapest preferred rate, buy the label, record tracking, and
            mark this order shipped, all in one click.
          </p>
          <button
            type="submit"
            className="inline-flex h-10 items-center bg-ink px-5 text-caption text-parchment transition-opacity hover:opacity-85"
          >
            Generate label &amp; ship
          </button>
        </form>
      ) : null}

      <details
        className="mt-6 border-t border-limestone-deep/60 pt-6"
        open={!shippoEnabled}
      >
        <summary className="cursor-pointer text-eyebrow text-ink-muted hover:text-olive">
          {shippoEnabled ? 'Or enter tracking manually' : 'Enter tracking manually'}
        </summary>
        <form action={shipOrderAction} className="mt-4 space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <FormField id="carrier" label="Carrier">
            <Select
              id="carrier"
              name="carrier"
              options={[
                { value: 'UPS', label: 'UPS' },
                { value: 'FEDEX', label: 'FedEx' },
                { value: 'USPS', label: 'USPS' },
                { value: 'DHL', label: 'DHL' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </FormField>
          <FormField id="trackingNumber" label="Tracking number">
            <TextInput
              id="trackingNumber"
              name="trackingNumber"
              placeholder="1Z… or equivalent"
              required
              minLength={3}
              maxLength={60}
            />
          </FormField>
          <FormField id="note" label="Fulfillment note (internal)">
            <Textarea id="note" name="note" rows={2} maxLength={500} />
          </FormField>
          <button
            type="submit"
            className="inline-flex h-10 items-center border border-ink/30 bg-parchment-warm/40 px-5 text-caption text-ink transition-colors hover:border-olive hover:text-olive"
          >
            Mark shipped manually
          </button>
        </form>
      </details>
    </div>
  )
}

function DeliverForm({ orderId }: { orderId: string }) {
  return (
    <form
      action={deliverOrderAction}
      className="space-y-4 border border-limestone-deep/60 bg-parchment p-6"
    >
      <p className="text-eyebrow text-bronze">Mark as delivered</p>
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-caption leading-relaxed text-ink-soft">
        Use once the carrier confirms delivery. This closes the order&apos;s
        fulfillment path and starts the return-window clock on eligible
        lines.
      </p>
      <button
        type="submit"
        className="inline-flex h-10 items-center bg-olive-deep px-5 text-caption text-parchment transition-opacity hover:opacity-85"
      >
        Mark delivered
      </button>
    </form>
  )
}

function RefundForm({
  orderId,
  remainingCents,
  currency,
}: {
  orderId: string
  remainingCents: number
  currency: string
}) {
  const maxAmount = (remainingCents / 100).toFixed(2)
  return (
    <form
      action={refundOrderAction}
      className="space-y-4 border border-murex-purple/30 bg-parchment p-6"
    >
      <p className="text-eyebrow text-murex-purple">Issue refund · Admin only</p>
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-caption leading-relaxed text-ink-soft">
        Issues via Stripe to the original payment method. Up to{' '}
        <span className="font-mono text-ink">
          <Price cents={remainingCents} currency={currency} />
        </span>{' '}
        remaining.
      </p>
      <FormField id="amountCents" label="Amount (cents)">
        <TextInput
          id="amountCents"
          name="amountCents"
          type="number"
          defaultValue={remainingCents}
          placeholder={`Max ${remainingCents} (${maxAmount})`}
          required
        />
      </FormField>
      <FormField id="reason" label="Reason">
        <Select
          id="reason"
          name="reason"
          options={[
            { value: 'DEFECTIVE', label: 'Defective' },
            { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
            { value: 'NOT_RECEIVED', label: 'Not received' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
      </FormField>
      <FormField id="note" label="Refund note (internal)">
        <Textarea id="note" name="note" rows={2} maxLength={500} />
      </FormField>
      <button
        type="submit"
        className="inline-flex h-10 items-center bg-murex-purple px-5 text-caption text-parchment transition-opacity hover:opacity-85"
      >
        Issue refund
      </button>
    </form>
  )
}

function NoteForm({ orderId, note }: { orderId: string; note: string }) {
  return (
    <form
      action={updateNoteAction}
      className="space-y-4 border border-limestone-deep/60 bg-parchment p-6"
    >
      <p className="text-eyebrow text-ink-muted">Internal note</p>
      <input type="hidden" name="orderId" value={orderId} />
      <FormField
        id="note"
        label="Note (staff-only)"
        hint="Not visible to the customer."
      >
        <Textarea id="note" name="note" rows={4} defaultValue={note} />
      </FormField>
      <button
        type="submit"
        className="inline-flex h-10 items-center border border-ink/30 px-5 text-caption text-ink transition-colors hover:border-olive hover:text-olive"
      >
        Save note
      </button>
    </form>
  )
}

function Flash({ kind, message }: { kind: 'success' | 'error'; message: string }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={`mb-6 inline-block border-l py-3 pl-4 pr-6 text-caption leading-relaxed ${
        kind === 'success'
          ? 'border-olive bg-olive/10 text-olive-deep'
          : 'border-cedar-deep bg-cedar/10 text-cedar-deep'
      }`}
    >
      {message}
    </p>
  )
}

function buildFlash(
  sp: Record<string, string | string[] | undefined>,
): { kind: 'success' | 'error'; message: string } | null {
  const first = (name: string) => {
    const v = sp[name]
    return Array.isArray(v) ? v[0] : v
  }
  if (first('shipped')) return { kind: 'success', message: 'Order marked shipped.' }
  if (first('delivered')) return { kind: 'success', message: 'Order marked delivered.' }
  if (first('refunded')) return { kind: 'success', message: 'Refund issued via Stripe.' }
  if (first('note')) return { kind: 'success', message: 'Internal note saved.' }
  const err = first('error')
  if (err) {
    const msg = first('msg') ?? null
    return {
      kind: 'error',
      message: msg ?? 'Action failed. See server logs for details.',
    }
  }
  return null
}
