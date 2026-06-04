import { z } from 'zod'

/**
 * Environment validation. Server and client envs are parsed separately so that
 * secrets can never leak into the browser bundle. Most variables are optional
 * during Phase 2 so the shell runs without real infrastructure.
 */

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Auth — NextAuth credentials provider + staff invites
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),

  // Database — User, AuditLog, Invite
  DATABASE_URL: z.string().url().optional(),

  // Upstash — rate limiter backing cart actions + auth/contact forms
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Resend — transactional email (staff invites)
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM_ADDRESS: z.string().min(1).optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),

  // Shared secret sent by cronjobs.org as `Authorization: Bearer …`
  // Currently used by /api/cron/prune-audit only.
  CRON_SECRET: z.string().min(16).optional(),

  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Shopify Storefront API (headless catalog)
  SHOPIFY_STOREFRONT_TOKEN: z.string().min(1).optional(),
  SHOPIFY_STOREFRONT_API_VERSION: z.string().min(1).default('2025-10'),
  /// Shared secret Shopify uses to sign webhook bodies. Required for
  /// /api/shopify/webhook to verify and act on cache-invalidation events.
  SHOPIFY_WEBHOOK_SECRET: z.string().min(1).optional(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: z.string().min(1).optional(),
})

function parse<T extends z.ZodTypeAny>(schema: T, raw: Record<string, unknown>, label: string): z.infer<T> {
  // Treat empty-string vars as "not set". .env files and Vercel routinely carry
  // blank placeholders (e.g. `SHOPIFY_WEBHOOK_SECRET=`), and `.optional()` should
  // accept those as undefined rather than failing `.min(1)` at build time.
  const cleaned: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v !== '') cleaned[k] = v
  }
  const result = schema.safeParse(cleaned)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid ${label} environment variables:\n${issues}`)
  }
  return result.data
}

export const serverEnv = parse(serverEnvSchema, process.env, 'server')

export const clientEnv = parse(
  clientEnvSchema,
  {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  },
  'client',
)

export const isProd = serverEnv.NODE_ENV === 'production'
export const isDev = serverEnv.NODE_ENV === 'development'
