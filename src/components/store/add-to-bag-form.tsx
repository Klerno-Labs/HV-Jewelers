'use client'

import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { addToBag } from '@/lib/cart/actions'
import { Button } from '@/components/ui/button'

export interface AddToBagFormProps {
  productId: string
  productSlug: string
  /// Drives copy + button label.
  state:
    | { kind: 'available'; remaining: number }
    | { kind: 'last-one' }
    | { kind: 'made-to-order' }
    | { kind: 'sold' }
    | { kind: 'on-hold' }
  /// When set, pre-renders an error message after a failed add.
  errorCode?: string | null
}

const ERROR_COPY: Record<string, string> = {
  no_stock: 'This piece was just added to another bag. We’re holding inventory for the next interested buyer.',
  rate_limit: 'A bit too quickly. Please try again in a moment.',
  unavailable: 'This piece is no longer available.',
  already_in_bag: 'This piece is already in your bag.',
}

export function AddToBagForm({
  productId,
  productSlug,
  state,
  errorCode,
}: AddToBagFormProps) {
  if (state.kind === 'sold' || state.kind === 'on-hold') {
    return (
      <div>
        <p className="text-eyebrow text-cedar-deep">
          {state.kind === 'sold' ? 'Sold' : 'Currently held'}
        </p>
        <p className="mt-3 max-w-md text-body leading-relaxed text-ink-soft">
          {state.kind === 'sold'
            ? "This piece has been bought. We add new pieces every few weeks; send a note and we'll keep an eye out for something similar."
            : "This piece is on a brief hold, likely out for photography or inspection. Send a note and we'll let you know when it returns."}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          <Link
            href="/contact"
            className="text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors hover:text-olive hover:decoration-olive"
          >
            Inquire after a similar piece →
          </Link>
          <Link
            href="/collections/new-arrivals"
            className="text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/40 transition-colors hover:text-olive hover:decoration-olive"
          >
            See New Arrivals
          </Link>
        </div>
      </div>
    )
  }

  const label =
    state.kind === 'made-to-order' ? 'Place a made-to-order request' : 'Add to bag'
  const helper =
    state.kind === 'made-to-order'
      ? 'Made-to-order pieces are reserved at request and produced on the bench. Lead time is shared at confirmation.'
      : state.kind === 'last-one'
        ? 'One only. We’ll hold it for fifteen minutes once added.'
        : 'We’ll hold this piece for fifteen minutes once added.'

  return (
    <form action={addToBag} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <SubmitButton label={label} />
      <p className="text-caption leading-relaxed text-ink-muted">{helper}</p>
      {errorCode ? (
        <p
          role="alert"
          className="border-l border-cedar-deep pl-3 text-caption leading-relaxed text-cedar-deep"
        >
          {ERROR_COPY[errorCode] ?? 'Something went wrong. Please try again.'}
        </p>
      ) : null}
    </form>
  )
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full sm:w-auto sm:min-w-[16rem]"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? 'Holding the piece…' : label}
    </Button>
  )
}
