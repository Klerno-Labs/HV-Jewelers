'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { signIn } from '@/auth'
import { authLimiter, getClientKey } from '@/lib/rate-limit'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'
import { loginInput } from '@/lib/validation/auth'

export type LoginState = {
  error?: string
} | null

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = String(formData.get('email') ?? '')
  const rawPassword = String(formData.get('password') ?? '')
  const rawFrom = String(formData.get('from') ?? '')

  // Generic, non-leaky failure message used for ALL failures — never
  // signal whether the email exists, the password is wrong, the account
  // is disabled, etc.
  const GENERIC_FAILURE = 'Email or password is incorrect.'

  const parsed = loginInput.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) {
    return { error: GENERIC_FAILURE }
  }
  const { email, password } = parsed.data

  // Rate-limit by (client + email) so one bad actor cannot drain a
  // shared-IP user's quota, and one user cannot brute force a single
  // account from a residential ISP.
  const requestHeaders = await headers()
  const key = `${getClientKey(requestHeaders)}:${email}`
  try {
    const rl = await authLimiter.limit(key)
    if (!rl.success) {
      return { error: 'Too many attempts. Please wait a moment and try again.' }
    }
  } catch {
    // If the rate limiter is misconfigured in production it throws and
    // we surface a generic error rather than silently allow.
    return { error: 'Sign-in temporarily unavailable. Please try again shortly.' }
  }

  const redirectTo = safeRedirectPath(rawFrom || null, '/admin')

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: GENERIC_FAILURE }
    }
    // Re-throw NEXT_REDIRECT and any other framework errors so Next.js
    // can complete the redirect after a successful sign-in.
    throw error
  }

  // Should be unreachable — signIn redirects on success.
  redirect(redirectTo)
}
