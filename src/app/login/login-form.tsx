'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, type LoginState } from './actions'
import { Button } from '@/components/ui/button'

export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, null)

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="from" value={from} />

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        autoFocus
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        minLength={1}
      />

      {state?.error ? (
        <p
          role="alert"
          className="text-caption text-cedar-deep"
          data-testid="login-error"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-eyebrow text-ink-muted">
        Internal access only. Customer accounts arrive in a later phase.
      </p>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  )
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  autoFocus,
  minLength,
}: {
  label: string
  name: string
  type: 'email' | 'password'
  autoComplete: string
  required?: boolean
  autoFocus?: boolean
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
        type={type}
        autoComplete={autoComplete}
        required={required}
        autoFocus={autoFocus}
        minLength={minLength}
        className="block w-full border border-limestone-deep bg-parchment-warm/40 px-4 py-3 text-body text-ink placeholder:text-ink-muted/70 focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      />
    </div>
  )
}
