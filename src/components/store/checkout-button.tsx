'use client'

import { useFormStatus } from 'react-dom'
import { startCheckout } from '@/app/checkout/actions'
import { Button } from '@/components/ui/button'

export function CheckoutButton() {
  return (
    <form action={startCheckout}>
      <SubmitButton />
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
      {pending ? 'Preparing checkout…' : 'Continue to checkout'}
    </Button>
  )
}
