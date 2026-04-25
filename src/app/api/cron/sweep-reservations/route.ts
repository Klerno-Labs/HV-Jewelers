import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron/auth'
import { sweepExpiredReservations } from '@/lib/products/inventory'

/**
 * Sweep expired RESERVED inventory items back to AVAILABLE.
 *
 * Runs every 5 minutes (Vercel Cron config in vercel.json). The Phase 3
 * helper handles the per-row ledger entries and conditional UPDATEs.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const released = await sweepExpiredReservations()
    return NextResponse.json({ ok: true, released })
  } catch (err) {
    console.error('[cron/sweep-reservations] failed', err)
    return NextResponse.json({ error: 'sweep failed' }, { status: 500 })
  }
}
