import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { hashInviteToken } from '@/lib/auth/invites'
import { acceptInviteAction } from './actions'

export const metadata: Metadata = {
  title: 'Accept invite',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string }>
}

const ERRORS: Record<string, string> = {
  invalid: 'This invite link isn’t valid. Ask your admin to re-send it.',
  expired: 'This invite has expired. Ask your admin to re-send it.',
  mismatch: 'The two passwords didn’t match. Please try again.',
  weak: 'Use at least 12 characters with a mix of upper, lower, and digits.',
  rate_limit: 'Too many attempts. Please wait a moment and try again.',
  unavailable: 'Invite service is temporarily unavailable. Please try again shortly.',
}

export default async function InvitePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const token = sp.token ?? ''

  // Look up the invite to confirm it's valid before rendering the form.
  // We never expose the email in the URL; we pull it from the token.
  let inviteValid = false
  let email: string | null = null
  if (token) {
    try {
      const user = await prisma.user.findFirst({
        where: { inviteTokenHash: hashInviteToken(token) },
        select: {
          email: true,
          inviteExpiresAt: true,
          isDisabled: true,
        },
      })
      if (
        user &&
        !user.isDisabled &&
        user.inviteExpiresAt &&
        user.inviteExpiresAt > new Date()
      ) {
        inviteValid = true
        email = user.email
      }
    } catch {
      // Fail-soft: treat as invalid.
    }
  }

  const error = sp.error ? ERRORS[sp.error] ?? 'Something went wrong.' : null

  return (
    <Container className="py-20 md:py-24" width="reading">
      <div className="mx-auto max-w-md">
        <p className="text-eyebrow text-bronze">Accept invite</p>
        <h1 className="mt-6 font-serif text-display italic font-light text-ink">
          Welcome to the house.
        </h1>
        <p className="mt-6 text-body leading-relaxed text-ink-soft">
          {inviteValid && email
            ? `Set a password for ${email}. You'll sign in with this email and password from now on.`
            : 'This invite link could not be verified. Ask your admin to re-send it.'}
        </p>

        <div className="hv-gold-rule my-10 w-16" />

        {inviteValid ? (
          <form action={acceptInviteAction} className="space-y-6" noValidate>
            <input type="hidden" name="token" value={token} />

            <Field
              label="New password"
              name="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
            <Field
              label="Confirm password"
              name="confirm"
              autoComplete="new-password"
              required
              minLength={12}
            />

            {error ? (
              <p role="alert" className="text-caption text-cedar-deep">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Set password &amp; sign in
            </Button>

            <p className="text-eyebrow text-ink-muted">
              Use 12+ characters with a mix of upper, lower, and digits.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            {error ? (
              <p role="alert" className="text-caption text-cedar-deep">
                {error}
              </p>
            ) : null}
            <p className="text-caption text-ink-muted">
              Need help?{' '}
              <Link
                href="/contact"
                className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
              >
                Contact the concierge
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </Container>
  )
}

function Field({
  label,
  name,
  autoComplete,
  required,
  minLength,
}: {
  label: string
  name: string
  autoComplete: string
  required?: boolean
  minLength?: number
}) {
  const id = `field-${name}`
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-eyebrow text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="password"
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="block w-full border border-limestone-deep bg-parchment-warm/40 px-4 py-3 text-body text-ink placeholder:text-ink-muted/70 focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      />
    </div>
  )
}
