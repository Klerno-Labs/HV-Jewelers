import { z } from 'zod'

/**
 * Environment validation. Server and client envs are parsed separately so that
 * secrets can never leak into the browser bundle. Most variables are optional
 * during Phase 2 so the shell runs without real infrastructure.
 */

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Auth (Phase 4)
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),

  // Database (Phase 3)
  DATABASE_URL: z.string().url().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),

  // Upstash rate limiter
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Stripe — payments
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_TAX_ENABLED: z.enum(['true', 'false']).default('false'),

  // Resend — transactional email
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM_ADDRESS: z.string().min(1).optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),

  // Shippo — shipping labels
  SHIPPO_API_KEY: z.string().min(1).optional(),
  SELLER_SHIP_FROM_NAME: z.string().min(1).optional(),
  SELLER_SHIP_FROM_STREET1: z.string().min(1).optional(),
  SELLER_SHIP_FROM_CITY: z.string().min(1).optional(),
  SELLER_SHIP_FROM_STATE: z.string().length(2).optional(),
  SELLER_SHIP_FROM_POSTAL: z.string().min(3).optional(),
  SELLER_SHIP_FROM_PHONE: z.string().min(1).optional(),

  // Shared secret sent by cronjobs.org as `Authorization: Bearer …`
  CRON_SECRET: z.string().min(16).optional(),

  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
})

function parse<T extends z.ZodTypeAny>(schema: T, raw: Record<string, unknown>, label: string): z.infer<T> {
  const result = schema.safeParse(raw)
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
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
  'client',
)

export const isProd = serverEnv.NODE_ENV === 'production'
export const isDev = serverEnv.NODE_ENV === 'development'
