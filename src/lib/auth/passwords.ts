import bcrypt from 'bcryptjs'

/**
 * Password hashing + verification.
 *
 * Why bcryptjs: pure JavaScript, deploys cleanly on Vercel without native
 * build steps. Cost factor 12 ≈ 200ms/op which is appropriate for an
 * admin-and-customer-account use case (low frequency). If sign-in volume
 * grows materially, switch to @node-rs/argon2.
 *
 * The verify path always runs bcrypt.compare against a real hash — even
 * when the user is not found — to make user-existence not detectable via
 * response timing.
 */

const COST = 12

/**
 * A pre-computed bcrypt hash used for the constant-time decoy. Replacing
 * the real hash check with this one keeps the cost balanced when the
 * user lookup misses. Pre-computing avoids paying ~200ms on cold start.
 */
const DECOY_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8zvLHUJrm6m6jvAXjvcD6qfPzfFqzy'

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== 'string' || plain.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  return bcrypt.hash(plain, COST)
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (typeof plain !== 'string' || plain.length === 0) {
    // Still run a compare so the timing matches a missing-user attempt.
    await bcrypt.compare('placeholder', DECOY_HASH)
    return false
  }
  if (!hash) {
    await bcrypt.compare(plain, DECOY_HASH)
    return false
  }
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}

/**
 * Heuristic password strength check. Not exhaustive — long strings beat
 * complex short ones. Used at password set/change time, not at login.
 */
export function passwordStrengthIssues(plain: string): string[] {
  const issues: string[] = []
  if (plain.length < 12) issues.push('Use at least 12 characters.')
  if (!/[a-z]/.test(plain)) issues.push('Include at least one lowercase letter.')
  if (!/[A-Z]/.test(plain)) issues.push('Include at least one uppercase letter.')
  if (!/[0-9]/.test(plain)) issues.push('Include at least one digit.')
  return issues
}
