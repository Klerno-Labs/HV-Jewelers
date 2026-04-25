import { createHash, randomBytes } from 'node:crypto'

/**
 * Staff invite tokens.
 *
 * We store the SHA-256 of the raw token in the DB so a DB breach never
 * surfaces usable tokens. The raw token is only ever present in the
 * invite email and the URL the recipient clicks. Verification hashes
 * the incoming value with the same algorithm and does a constant-time
 * compare against the stored hash.
 */

const TOKEN_BYTES = 32 // 256 bits, base64url-encoded → 43 chars
export const INVITE_TTL_MS = 48 * 60 * 60 * 1000 // 48 hours

export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(TOKEN_BYTES).toString('base64url')
  const hash = hashInviteToken(raw)
  return { raw, hash }
}

export function hashInviteToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function invitesMatch(rawFromUrl: string, storedHash: string): boolean {
  if (typeof rawFromUrl !== 'string' || typeof storedHash !== 'string') return false
  if (storedHash.length !== 64) return false // sha256 hex
  const candidate = hashInviteToken(rawFromUrl)
  if (candidate.length !== storedHash.length) return false
  // Hex strings, so a simple timing-safe compare is fine.
  let diff = 0
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ storedHash.charCodeAt(i)
  }
  return diff === 0
}
