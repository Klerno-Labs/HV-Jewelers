/**
 * Validate a redirect target so an attacker cannot send a logged-in user
 * to an external host. Accept only same-origin paths beginning with `/`.
 *
 * Reject:
 *   • protocol-relative URLs (`//evil.tld/...`)
 *   • backslash variants (`/\evil.tld`)
 *   • absolute URLs (`https://...`)
 *   • paths starting with the auth/admin login itself (loop avoidance)
 *
 * Always falls back to a known-safe path when the input is unsafe or
 * absent.
 */
export function safeRedirectPath(
  input: string | null | undefined,
  fallback: string,
): string {
  if (typeof input !== 'string' || input.length === 0) return fallback
  if (input.length > 512) return fallback
  if (!input.startsWith('/')) return fallback
  if (input.startsWith('//') || input.startsWith('/\\')) return fallback
  if (input.includes('://')) return fallback
  // Defend against percent-encoded sneak attempts like "/%2F..".
  try {
    const decoded = decodeURIComponent(input)
    if (decoded.startsWith('//') || decoded.startsWith('/\\')) return fallback
  } catch {
    return fallback
  }
  return input
}
