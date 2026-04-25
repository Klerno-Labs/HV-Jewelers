import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { serverEnv, isProd } from './env'

/**
 * Distributed rate limiting via Upstash Redis. Configured lazily: when env vars
 * are absent in development the limiters fail-open so the app is usable. In
 * production, unconfigured limiters throw — we never silently disable a security
 * control on a live deployment.
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

function buildLimiter(config: {
  requests: number
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
  prefix: string
}): Limiter {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: config.prefix,
    })
  }
  if (isProd) {
    return {
      async limit() {
        throw new Error(
          `Rate limiter "${config.prefix}" is not configured in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.`,
        )
      },
    }
  }
  // Dev fallback: fail-open with informational shape.
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
