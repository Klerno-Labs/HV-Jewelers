import { randomInt } from 'node:crypto'
import { prisma } from '@/lib/prisma'

/**
 * Human-readable order number. Format: HV-<2-digit-year>-<6 chars>.
 * Example: HV-26-A4F9K2.
 *
 * The 6-char suffix is base32-style (no I, O, 0, 1) for readability over
 * the phone. Generated with crypto.randomInt so customers cannot guess
 * sequential order numbers — never embed an auto-increment id here.
 *
 * On the rare collision we retry; after a few tries we give up and
 * surface an error rather than mint a duplicate.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 chars
const SUFFIX_LEN = 6
const MAX_ATTEMPTS = 6

function randomSuffix(): string {
  let out = ''
  for (let i = 0; i < SUFFIX_LEN; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)]
  }
  return out
}

function yearPrefix(at: Date): string {
  return `HV-${String(at.getFullYear()).slice(-2)}-`
}

export async function generateOrderNumber(now: Date = new Date()): Promise<string> {
  const prefix = yearPrefix(now)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `${prefix}${randomSuffix()}`
    const existing = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    })
    if (!existing) return candidate
  }
  throw new Error('Failed to generate a unique order number after retries.')
}
