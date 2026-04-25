import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const session = await auth()

  return (
    <Container className="py-16 md:py-20" width="reading">
      <Breadcrumbs
        items={[{ label: 'HV Jewelers', href: '/' }, { label: 'Account' }]}
      />
      <div className="mt-10">
        <p className="text-eyebrow text-bronze">Account</p>
        {session?.user ? (
          <SignedIn email={session.user.email ?? ''} name={session.user.name ?? null} />
        ) : (
          <SignedOut />
        )}
      </div>
    </Container>
  )
}

function SignedIn({ email, name }: { email: string; name: string | null }) {
  return (
    <>
      <h1 className="mt-4 font-serif text-display text-ink">
        Welcome back, {name ?? email.split('@')[0]}.
      </h1>
      <p className="mt-6 text-body leading-relaxed text-ink-soft">
        Customer-side account features (orders, addresses, saved pieces)
        arrive in a later phase. For now your sign-in keeps your bag and
        identity together across visits.
      </p>
      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Pair label="Email" value={email} />
        <Pair label="Member since" value="Today" />
      </dl>
      <div className="mt-12 flex flex-wrap gap-6">
        <Link
          href="/bag"
          className="text-caption text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
        >
          View your bag →
        </Link>
        <Link
          href="/collections/new-arrivals"
          className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
        >
          Browse New Arrivals
        </Link>
      </div>
    </>
  )
}

function SignedOut() {
  return (
    <>
      <h1 className="mt-4 font-serif text-display text-ink">Sign in.</h1>
      <p className="mt-6 max-w-lg text-body leading-relaxed text-ink-soft">
        Customer accounts arrive in a later phase, with order history,
        saved addresses, and concierge holds. The sign-in surface is live
        for staff already.
      </p>
      <div className="mt-10 flex flex-wrap gap-6">
        <Link
          href="/login?from=/account"
          className="text-caption text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
        >
          Staff sign-in →
        </Link>
        <Link
          href="/contact"
          className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
        >
          Concierge purchase
        </Link>
      </div>
    </>
  )
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow text-ink-muted">{label}</dt>
      <dd className="mt-2 text-body text-ink">{value}</dd>
    </div>
  )
}
