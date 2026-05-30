import { render } from '@react-email/render'
import StaffInviteEmail from '@/emails/staff-invite'
import { fromAddress, getResend, isEmailConfigured, replyTo } from './client'

/**
 * Transactional email senders.
 *
 * Order-related templates (confirmation, shipped, refunded) were
 * retired with the Prisma catalog — Shopify-hosted checkout sends its
 * own equivalents from the merchant's notification settings.
 *
 * Remaining template: staff-invite, fired from /admin/users/new.
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
