import { serverEnv } from '@/lib/env'

/**
 * Cron authentication. The configured cron service (cronjobs.org) is
 * set up to send `Authorization: Bearer ${CRON_SECRET}` on every hit.
 * We reject anything else with 401 so nobody can trigger a sweep by
 * hitting the URL directly.
 *
 * In dev, a request with no header from localhost is also accepted so
 * operators can curl the endpoint while debugging.
 */

export function isCronAuthorized(request: Request): boolean {
  const auth = request.headers.get('authorization')
  const secret = serverEnv.CRON_SECRET
  if (secret && auth === `Bearer ${secret}`) return true

  if (serverEnv.NODE_ENV !== 'production') {
    // Dev only: allow localhost curls without a secret.
    const host = request.headers.get('host') ?? ''
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
      return true
    }
  }

  return false
}
