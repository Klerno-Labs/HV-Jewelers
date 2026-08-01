import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env'
import { exportSalesEvents, salesMeasurementConfigured } from '@/lib/sales/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(header: string | null): boolean {
  const token = serverEnv.SALES_EXPORT_TOKEN
  if (!token || !header?.startsWith('Bearer ')) return false
  const supplied = header.slice('Bearer '.length)
  const expectedBuffer = Buffer.from(token)
  const suppliedBuffer = Buffer.from(supplied)
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  )
}

export async function GET(request: Request) {
  if (
    !salesMeasurementConfigured() ||
    serverEnv.SALES_EXPORT_ENABLED !== 'true' ||
    !serverEnv.SALES_EXPORT_TOKEN
  ) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }
  if (!authorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = new URL(request.url)
  const requestedDays = Number.parseInt(url.searchParams.get('days') ?? '31', 10)
  const days = Number.isFinite(requestedDays)
    ? Math.min(Math.max(requestedDays, 1), 90)
    : 31
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const events = await exportSalesEvents(since)
  return NextResponse.json(events, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'attachment; filename="hv-sales-events.json"',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
