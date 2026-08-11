import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { serverEnv, isProd } from './env'

/**
 * Distributed rate limiting via Upstash Redis. Configured lazily: when env vars
 * are absent in development the limiters fail-open so the app is usable.
 *
 * In production an unconfigured limiter falls back to an in-process sliding
 * window rather than throwing. The previous behaviour — throw when Redis is
 * absent — meant a missing env var took down every cart action (add to bag
 * 500s before it ever reaches Shopify) and blocked admin login. A rate limiter
 * exists to blunt abuse; it must never be the thing that stops customers from
 * buying. The fallback is deliberately loud in the logs so the degraded state
 * is visible instead of silent.
 */

const isConfigured = Boolean(
  serverEnv.UPSTASH_REDIS_REST_URL && serverEnv.UPSTASH_REDIS_REST_TOKEN,
)

const redis = isConfigured
  ? new Redis({
      url: serverEnv.UPSTASH_REDIS_REST_URL!,
      token: serverEnv.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

type Limiter = {
  limit: (identifier: string) => Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }>
}

interface LimiterConfig {
  requests: number
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
  prefix: string
}

const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

/** Upstash windows are duration strings ("15 m"); we need them as millis. */
function windowToMs(window: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(window.trim())
  if (!match) return 60_000
  return Number(match[1]) * (UNIT_MS[match[2]!] ?? 1_000)
}

let warnedDegraded = false

function warnDegradedOnce() {
  if (warnedDegraded) return
  warnedDegraded = true
  console.error(
    '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. ' +
      'Falling back to per-instance in-memory rate limiting: limits are enforced ' +
      'per serverless instance and reset on cold start. Configure Upstash to ' +
      'restore distributed limits.',
  )
}

/**
 * In-process sliding window. Strictly weaker than the Redis limiter — state is
 * per-instance and lost on cold start, so with N warm instances the effective
 * ceiling is roughly `requests × N` — but it never throws and still stops a
 * single client hammering one instance. Used only when Redis is unavailable.
 */
function buildMemoryLimiter(config: LimiterConfig): Limiter {
  const windowMs = windowToMs(String(config.window))
  const hits = new Map<string, number[]>()
  let lastPrune = 0

  return {
    async limit(identifier: string) {
      const now = Date.now()
      const cutoff = now - windowMs

      // Bound memory: sweep expired identifiers at most once per window so a
      // long-lived instance can't accumulate a key per visitor forever.
      if (now - lastPrune > windowMs) {
        for (const [key, times] of hits) {
          const live = times.filter((t) => t > cutoff)
          if (live.length === 0) hits.delete(key)
          else hits.set(key, live)
        }
        lastPrune = now
      }

      const times = (hits.get(identifier) ?? []).filter((t) => t > cutoff)
      const success = times.length < config.requests
      if (success) times.push(now)
      hits.set(identifier, times)

      return {
        success,
        limit: config.requests,
        remaining: Math.max(0, config.requests - times.length),
        reset: (times[0] ?? now) + windowMs,
      }
    },
  }
}

function buildLimiter(config: LimiterConfig): Limiter {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: config.prefix,
    })
  }
  if (isProd) {
    warnDegradedOnce()
    return buildMemoryLimiter(config)
  }
  // Dev fallback: fail-open with informational shape, so local work is never
  // throttled by a control that has no Redis to talk to anyway.
  return {
    async limit() {
      return { success: true, limit: config.requests, remaining: config.requests, reset: 0 }
    },
  }
}

/** 5 attempts per 15 minutes — applied to login and password reset. */
export const authLimiter = buildLimiter({
  requests: 5,
  window: '15 m',
  prefix: 'hv:ratelimit:auth',
})

/** 10 submissions per hour — applied to contact forms and abuse-prone POSTs. */
export const contactLimiter = buildLimiter({
  requests: 10,
  window: '1 h',
  prefix: 'hv:ratelimit:contact',
})

/** 30 requests per minute — general abuse-prone API tier. */
export const apiLimiter = buildLimiter({
  requests: 30,
  window: '1 m',
  prefix: 'hv:ratelimit:api',
})

/**
 * 10 cart creates per minute — applied to the first `addToCartAction`
 * call from an IP without a cart cookie. Each create mints a new
 * Shopify cart against the per-shop Storefront API bucket, so this is
 * the most expensive path to keep tight.
 */
export const cartCreateLimiter = buildLimiter({
  requests: 10,
  window: '1 m',
  prefix: 'hv:ratelimit:cart-create',
})

/**
 * Extract a stable client identifier from a request. Prefer the userId when
 * authenticated (so one malicious user cannot drain their own quota by rotating
 * IPs); otherwise fall back to the first forwarded-for IP.
 */
export function getClientKey(headers: Headers, userId?: string | null): string {
  if (userId) return `user:${userId}`
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return `ip:${first}`
  }
  const real = headers.get('x-real-ip')
  if (real) return `ip:${real}`
  return 'ip:unknown'
}
