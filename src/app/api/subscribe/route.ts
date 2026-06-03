import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendSubscribeConfirmation } from '@/lib/emails/send'

/**
 * Newsletter / pre-launch email capture.
 *
 *   POST  { email, source?, website? }  → add to the Subscriber list (deduped),
 *                                          send a one-time welcome on new signup.
 *   GET                                 → { count } of active subscribers (social proof).
 *
 * Prisma needs the Node runtime (not edge). force-dynamic so the count is
 * never cached. The welcome email fails-soft (no RESEND key → it no-ops),
 * so signup never depends on email being configured.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  email: z.string().trim().toLowerCase().email(),
  source: z.string().trim().max(64).optional(),
  // Honeypot: a hidden field real people never fill. Bots do.
  website: z.string().optional(),
})

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  // Honeypot tripped → pretend success, store nothing.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  const { email } = parsed.data
  const source = parsed.data.source || 'storefront'
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = req.headers.get('user-agent') ?? null

  let created = false
  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } })
    if (!existing) {
      await prisma.subscriber.create({
        data: { email, source, ip, userAgent, status: 'subscribed' },
      })
      created = true
    } else if (existing.status === 'unsubscribed') {
      // Re-subscribe a previous opt-out; don't re-send the welcome.
      await prisma.subscriber.update({
        where: { email },
        data: { status: 'subscribed' },
      })
    }
  } catch (err) {
    console.error('[subscribe] db error', err)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }

  // Welcome only on a genuinely-new signup. Fire-and-forget, fails-soft.
  if (created) {
    void sendSubscribeConfirmation({ to: email })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  try {
    const count = await prisma.subscriber.count({
      where: { status: 'subscribed' },
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
