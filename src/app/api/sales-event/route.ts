import { NextResponse } from 'next/server'
import { apiLimiter, getClientKey } from '@/lib/rate-limit'
import { clientSalesEventSchema } from '@/lib/sales/contracts'
import {
  recordClientSalesEvent,
  salesMeasurementConfigured,
  storeSalesSessionCookie,
} from '@/lib/sales/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!salesMeasurementConfigured()) {
    return new NextResponse(null, { status: 204 })
  }
  const rate = await apiLimiter.limit(getClientKey(request.headers))
  if (!rate.success) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const parsed = clientSalesEventSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_event' }, { status: 400 })
  }
  await recordClientSalesEvent(parsed.data)
  await storeSalesSessionCookie(parsed.data.sessionId)
  return NextResponse.json({ ok: true }, { status: 202 })
}
