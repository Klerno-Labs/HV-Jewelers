import { Resend } from 'resend'
import { serverEnv } from '@/lib/env'

/**
 * Resend client. Fails-soft so pages can render without a key — the
 * helper functions in `send.ts` no-op (and log) when unconfigured so a
 * missing env var never brings down checkout.
 */

let _resend: Resend | null = null

export function getResend(): Resend | null {
  if (_resend) return _resend
  if (!serverEnv.RESEND_API_KEY) return null
  _resend = new Resend(serverEnv.RESEND_API_KEY)
  return _resend
}

export function isEmailConfigured(): boolean {
  return Boolean(serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM_ADDRESS)
}

export function fromAddress(): string {
  return serverEnv.EMAIL_FROM_ADDRESS ?? 'Hoang Vi <concierge@hvjewelers.com>'
}

export function replyTo(): string | undefined {
  return serverEnv.EMAIL_REPLY_TO ?? undefined
}
