import { render } from '@react-email/render'
import type { Order, OrderLine } from '@prisma/client'
import OrderConfirmationEmail from '@/emails/order-confirmation'
import OrderShippedEmail from '@/emails/order-shipped'
import OrderRefundedEmail from '@/emails/order-refunded'
import StaffInviteEmail from '@/emails/staff-invite'
import { fromAddress, getResend, isEmailConfigured, replyTo } from './client'

/**
 * Transactional email senders.
 *
 * Policy:
 *   • Every send is fail-soft — errors are logged, not thrown. A broken
 *     Resend key should never break a Stripe webhook or a staff action.
 *   • Templates render to both HTML and a text fallback. The text
 *     variant matters for client inboxes that block HTML.
 *   • When Resend is unconfigured we log the intended send at INFO —
 *     useful for dev and for operator visibility before the key lands.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

async function safeSend(args: {
  to: string
  subject: string
  react: React.ReactElement
  replyToOverride?: string
  kind: string
}) {
  if (!isEmailConfigured()) {
    console.info(`[email] skipped ${args.kind} → ${args.to} (RESEND_API_KEY absent)`)
    return { ok: false as const, skipped: true as const }
  }
  try {
    const [html, text] = await Promise.all([
      render(args.react, { pretty: false }),
      render(args.react, { plainText: true }),
    ])
    const resend = getResend()
    if (!resend) return { ok: false as const, skipped: true as const }
    const result = await resend.emails.send({
      from: fromAddress(),
      to: args.to,
      subject: args.subject,
      html,
      text,
      replyTo: args.replyToOverride ?? replyTo(),
    })
    if (result.error) {
      console.error(`[email] ${args.kind} failed`, result.error)
      return { ok: false as const, error: result.error }
    }
    return { ok: true as const, id: result.data?.id }
  } catch (err) {
    console.error(`[email] ${args.kind} threw`, err)
    return { ok: false as const, error: err }
  }
}

/**
 * Send order confirmation (PAID). Called from the Stripe webhook
 * finalizer after the order transitions PENDING → PAID.
 */
export async function sendOrderConfirmation(
  order: Order & { lines: OrderLine[] },
) {
  if (!order.email) return { ok: false as const, skipped: true as const }
  return safeSend({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed — thank you`,
    kind: 'order-confirmation',
    react: OrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName: order.shipName || null,
      lines: order.lines.map((l) => ({
        title: l.productTitle,
        era: l.productEra,
        quantity: l.quantity,
        totalCents: l.totalCents,
      })),
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      currency: order.currency,
      shipTo: order.shipLine1
        ? {
            name: order.shipName,
            line1: order.shipLine1,
            line2: order.shipLine2,
            city: order.shipCity,
            region: order.shipRegion,
            postalCode: order.shipPostalCode,
            country: order.shipCountry,
          }
        : null,
      orderUrl: `${SITE_URL}/checkout/success?session_id=${order.stripeCheckoutSessionId ?? ''}`,
      signatureRequired: order.signatureRequired,
    }),
  })
}

/**
 * Send shipped notification. Called from `markShipped` after the order
 * transitions PAID → SHIPPED.
 */
export async function sendOrderShipped(
  order: Order,
  trackingUrl: string | null = null,
) {
  if (!order.email) return { ok: false as const, skipped: true as const }
  return safeSend({
    to: order.email,
    subject: `Order ${order.orderNumber} — on its way`,
    kind: 'order-shipped',
    react: OrderShippedEmail({
      orderNumber: order.orderNumber,
      customerName: order.shipName || null,
      carrier: order.carrier ?? 'Carrier',
      trackingNumber: order.trackingNumber ?? '',
      trackingUrl,
      signatureRequired: order.signatureRequired,
    }),
  })
}

/**
 * Send refund notification. Called from `issueRefund` after Stripe
 * accepts the refund and our DB is updated.
 */
export async function sendOrderRefunded(
  order: Order,
  amountCents: number,
  opts?: { note?: string | null; isFull?: boolean },
) {
  if (!order.email) return { ok: false as const, skipped: true as const }
  return safeSend({
    to: order.email,
    subject: `Order ${order.orderNumber} — refund issued`,
    kind: 'order-refunded',
    react: OrderRefundedEmail({
      orderNumber: order.orderNumber,
      customerName: order.shipName || null,
      amountCents,
      totalRefundedCents: order.totalRefundedCents,
      orderTotalCents: order.totalCents,
      currency: order.currency,
      note: opts?.note ?? null,
      isFull: opts?.isFull ?? order.totalRefundedCents >= order.totalCents,
    }),
  })
}

/**
 * Send staff invite with a one-time password-set link. Called from
 * `/admin/users/new` when an admin invites a staff member.
 */
export async function sendStaffInvite(args: {
  to: string
  inviteeName: string | null
  inviterName: string | null
  rawToken: string
  roleLabel: string
  expiresAt: Date
}) {
  const inviteUrl = `${SITE_URL}/invite?token=${encodeURIComponent(args.rawToken)}`
  return safeSend({
    to: args.to,
    subject: 'You have been invited to HV Jewelers',
    kind: 'staff-invite',
    react: StaffInviteEmail({
      inviteeName: args.inviteeName,
      inviterName: args.inviterName,
      inviteUrl,
      roleLabel: args.roleLabel,
      expiresAt: args.expiresAt.toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    }),
  })
}
