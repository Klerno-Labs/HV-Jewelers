'use client'

import { useFormStatus } from 'react-dom'
import { signOutAction } from '@/app/sign-out/actions'
import { cn } from '@/lib/cn'

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction} className={cn('inline-flex', className)}>
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="text-caption tracking-wide text-ink-soft transition-colors duration-300 hover:text-cedar-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-parchment disabled:opacity-60"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
