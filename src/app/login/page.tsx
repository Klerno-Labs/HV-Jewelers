import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Container } from '@/components/layout/container'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

interface LoginPageProps {
  searchParams: Promise<{ from?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const params = await searchParams
  const from = safeRedirectPath(params.from ?? null, '/admin')

  if (session?.user) {
    redirect(from)
  }

  return (
    <Container className="py-24" width="reading">
      <div className="mx-auto max-w-md">
        <p className="text-eyebrow text-bronze">Account</p>
        <h1 className="mt-6 font-serif text-display text-ink">Sign in</h1>
        <p className="mt-4 text-body leading-relaxed text-ink-soft">
          Internal team access. Use the email and password issued to you by an
          administrator.
        </p>

        <div className="hv-gold-rule my-10 w-16" />

        <LoginForm from={from} />

        <p className="mt-10 text-caption text-ink-muted">
          Trouble signing in?{' '}
          <Link href="/contact" className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive">
            Contact the brand directly.
          </Link>
        </p>
      </div>
    </Container>
  )
}
