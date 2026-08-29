'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addToCartAction, buyNowAction } from '@/app/shop/actions'
import type { ProductVariant, SelectedOption } from '@/lib/shopify/types'
import { cn } from '@/lib/cn'

interface OptionGroup {
  name: string
  values: string[]
}

type PendingAction = 'cart' | 'checkout' | null

function variantMatches(
  variant: ProductVariant,
  selected: Record<string, string>,
): boolean {
  return variant.selectedOptions.every((opt) => selected[opt.name] === opt.value)
}

function defaultSelection(variants: ProductVariant[]): Record<string, string> {
  if (variants.length === 0) return {}
  const first = variants.find((v) => v.availableForSale) ?? variants[0]
  if (!first) return {}
  const selection: Record<string, string> = {}
  first.selectedOptions.forEach((option: SelectedOption) => {
    selection[option.name] = option.value
  })
  return selection
}

export function AddToShopCartForm({
  variants,
  options,
}: {
  variants: ProductVariant[]
  options: OptionGroup[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    defaultSelection(variants),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const activeVariant = variants.find((variant) =>
    variantMatches(variant, selected),
  )
  const canAdd = activeVariant?.availableForSale ?? false
  const showOptionPicker =
    options.length > 0 && !(options.length === 1 && options[0]?.name === 'Title')

  function pick(name: string, value: string) {
    setSelected((previous) => ({ ...previous, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  function add() {
    if (!activeVariant) {
      setError('Choose a variant first.')
      return
    }
    setError(null)
    setSuccess(false)
    setPendingAction('cart')
    startTransition(async () => {
      try {
        const result = await addToCartAction(activeVariant.id, 1)
        if (!result.ok) {
          setError(result.userErrors[0]?.message ?? 'Could not add to bag.')
          return
        }
        setSuccess(true)
        router.refresh()
      } finally {
        setPendingAction(null)
      }
    })
  }

  function buyNow() {
    if (!activeVariant) {
      setError('Choose a variant first.')
      return
    }
    setError(null)
    setSuccess(false)
    setPendingAction('checkout')
    startTransition(async () => {
      try {
        const result = await buyNowAction(activeVariant.id)
        if (!result.ok) {
          setError(
            result.userErrors[0]?.message ??
              'Could not prepare checkout. Try adding the piece to your bag.',
          )
        }
      } finally {
        setPendingAction(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {showOptionPicker && (
        <div className="space-y-5">
          {options.map((group) => (
            <OptionRadioGroup
              key={group.name}
              group={group}
              selected={selected[group.name]}
              onPick={(value) => pick(group.name, value)}
            />
          ))}
        </div>
      )}

      <div className="grid gap-3">
        <button
          type="button"
          onClick={buyNow}
          disabled={!canAdd || pending}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center bg-ink px-8 text-eyebrow text-parchment transition-colors duration-300 hover:bg-olive-deep',
            (!canAdd || pending) && 'cursor-not-allowed opacity-55',
          )}
        >
          {pendingAction === 'checkout'
            ? 'Opening secure checkout…'
            : !activeVariant
              ? 'Choose a variant'
              : !activeVariant.availableForSale
                ? 'Sold out'
                : 'Buy now'}
        </button>

        <button
          type="button"
          onClick={add}
          disabled={!canAdd || pending}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center border px-8 text-eyebrow transition-colors duration-300',
            canAdd
              ? 'border-ink bg-parchment text-ink hover:border-olive hover:text-olive'
              : 'cursor-not-allowed border-temple-stone bg-temple-stone text-ink-muted',
            pending && 'opacity-55',
          )}
        >
          {pendingAction === 'cart'
            ? 'Adding…'
            : !activeVariant
              ? 'Choose a variant'
              : !activeVariant.availableForSale
                ? 'Sold out'
                : success
                  ? 'Added to bag ✓'
                  : 'Add to bag'}
        </button>
      </div>

      <p className="text-caption leading-relaxed text-ink-muted">
        Checkout is completed securely on Shopify. Shop Pay, Apple Pay, Google
        Pay, and eligible card options appear there when available.
      </p>

      {error && (
        <p role="alert" className="text-caption text-cedar-deep">
          {error}
        </p>
      )}
      {success && !error && (
        <p role="status" className="text-caption text-olive-deep">
          Added to bag. Open the bag to review and check out.
        </p>
      )}
    </div>
  )
}

function OptionRadioGroup({
  group,
  selected,
  onPick,
}: {
  group: OptionGroup
  selected: string | undefined
  onPick: (value: string) => void
}) {
  function handleKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key
    if (
      key !== 'ArrowRight' &&
      key !== 'ArrowLeft' &&
      key !== 'ArrowDown' &&
      key !== 'ArrowUp'
    ) {
      return
    }
    event.preventDefault()
    const index = group.values.findIndex((value) => value === selected)
    const length = group.values.length
    if (length === 0) return
    const delta = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1
    const nextIndex = index === -1 ? 0 : (index + delta + length) % length
    const next = group.values[nextIndex]
    if (next === undefined) return
    onPick(next)
    requestAnimationFrame(() => {
      const root = event.currentTarget
      if (!root) return
      const button = root.querySelector<HTMLButtonElement>(
        `button[data-value="${CSS.escape(next)}"]`,
      )
      button?.focus()
    })
  }

  return (
    <fieldset>
      <legend className="text-eyebrow text-ink-muted">{group.name}</legend>
      <div
        role="radiogroup"
        aria-label={group.name}
        onKeyDown={handleKey}
        className="mt-3 flex flex-wrap gap-2"
      >
        {group.values.map((value) => {
          const isActive = selected === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              data-value={value}
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onPick(value)}
              className={cn(
                'inline-flex h-10 items-center border px-4 text-caption transition-colors',
                isActive
                  ? 'border-ink bg-ink text-parchment'
                  : 'border-limestone-deep bg-parchment text-ink-soft hover:border-olive hover:text-olive',
                'focus-visible:outline-2 focus-visible:outline-bronze',
              )}
            >
              {value}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
