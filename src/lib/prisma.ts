import { PrismaClient } from '@prisma/client'
import { isProd } from './env'

/**
 * Prisma client singleton. In dev, Next.js HMR reloads modules and would
 * otherwise create a new client per reload, exhausting connections. We pin
 * the client to a global symbol so the same instance survives reloads.
 */

declare global {
  var __hvPrisma: PrismaClient | undefined
}

export const prisma =
  globalThis.__hvPrisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn'],
  })

if (!isProd) {
  globalThis.__hvPrisma = prisma
}
