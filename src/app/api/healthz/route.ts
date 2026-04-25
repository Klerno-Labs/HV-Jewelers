import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Liveness + database reachability probe. Kept intentionally narrow —
 * returns only boolean health signals, never secrets or env state. Safe
 * to expose to uptime monitors.
 *
 * Returns 200 with { ok, db } when reachable, 503 otherwise. The probe
 * is a simple `SELECT 1` so it doesn't touch business tables.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const started = Date.now()
  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch (err) {
    console.warn('[healthz] DB unreachable', err)
  }

  const body = { ok: dbOk, db: dbOk, ms: Date.now() - started }
  return NextResponse.json(body, { status: dbOk ? 200 : 503 })
}
