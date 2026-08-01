'use client'

import {
  normalizeAttributionToken,
  type ClientSalesEvent,
} from './contracts'

const SESSION_KEY = 'hv.sales.session'
const ATTRIBUTION_KEY = 'hv.sales.attribution'

type EventInput = Omit<
  ClientSalesEvent,
  'sessionId' | 'source' | 'medium' | 'campaign'
>

function enabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_SALES_MEASUREMENT_ENABLED === 'true' &&
    typeof window !== 'undefined' &&
    navigator.doNotTrack !== '1'
  )
}

function sessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const created = crypto.randomUUID()
  window.sessionStorage.setItem(SESSION_KEY, created)
  return created
}

function attribution(): { source: string; medium: string; campaign: string } {
  const existing = window.sessionStorage.getItem(ATTRIBUTION_KEY)
  if (existing) {
    try {
      return JSON.parse(existing) as ReturnType<typeof attribution>
    } catch {
      window.sessionStorage.removeItem(ATTRIBUTION_KEY)
    }
  }
  const params = new URLSearchParams(window.location.search)
  const value = {
    source: normalizeAttributionToken(params.get('utm_source')) || 'direct',
    medium: normalizeAttributionToken(params.get('utm_medium')) || 'none',
    campaign: normalizeAttributionToken(params.get('utm_campaign')) || 'none',
  }
  window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value))
  return value
}

export function trackSalesEvent(input: EventInput): void {
  if (!enabled()) return
  const body: ClientSalesEvent = {
    ...input,
    sessionId: sessionId(),
    ...attribution(),
  }
  void fetch('/api/sales-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {})
}
