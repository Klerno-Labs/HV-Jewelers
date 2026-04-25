'use client'

import { useFormStatus } from 'react-dom'
import { removeFromBag } from '@/lib/cart/actions'

export function RemoveFromBag({ cartItemId }: { cartItemId: string }) {
  return (
    <form action={removeFromBag} className="inline-flex">
      <input type="hidden" name="cartItemId" value={cartItemId} />
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
      className="text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/40 transition-colors duration-200 hover:text-cedar-deep hover:decoration-cedar-deep disabled:opacity-60"
    >
      {pending ? 'Releasing…' : 'Remove'}
    </button>
  )
}
