'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addToCartAction } from '@/app/shop/actions'
import type { ProductVariant, SelectedOption } from '@/lib/shopify/types'
import { cn } from '@/lib/cn'

interface OptionGroup {
  name: string
  values: string[]
}

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
  const sel: Record<string, string> = {}
  first.selectedOptions.forEach((o: SelectedOption) => {
    sel[o.name] = o.value
  })
  return sel
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
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    defaultSelection(variants),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const activeVariant = variants.find((v) => variantMatches(v, selected))
  const canAdd = activeVariant?.availableForSale ?? false
  const showOptionPicker =
    options.length > 0 && !(options.length === 1 && options[0]?.name === 'Title')

  function pick(name: string, value: string) {
    setSelected((prev) => ({ ...prev, [name]: value }))
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
    startTransition(async () => {
      const result = await addToCartAction(activeVariant.id, 1)
      if (!result.ok) {
        setError(result.userErrors[0]?.message ?? 'Could not add to bag.')
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {showOptionPicker && (
        <div className="space-y-5">
          {options.map((group) => (
            <fieldset key={group.name}>
              <legend className="text-eyebrow text-ink-muted">
                {group.name}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.values.map((value) => {
                  const isActive = selected[group.name] === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pick(group.name, value)}
                      aria-pressed={isActive}
                      className={cn(
                        'inline-flex h-10 items-center border px-4 text-caption transition-colors',
                        isActive
                          ? 'border-ink bg-ink text-parchment'
                          : 'border-limestone-deep bg-parchment text-ink-soft hover:border-olive hover:text-olive',
                      )}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        disabled={!canAdd || pending}
        className={cn(
          'inline-flex h-12 w-full items-center justify-center px-8 text-eyebrow transition-colors duration-300',
          canAdd
            ? 'bg-ink text-parchment hover:bg-olive-deep'
            : 'cursor-not-allowed bg-temple-stone text-ink-muted',
          pending && 'opacity-60',
        )}
      >
        {pending
          ? 'Adding…'
          : !activeVariant
            ? 'Choose a variant'
            : !activeVariant.availableForSale
              ? 'Sold out'
              : success
                ? 'Added to bag ✓'
                : 'Add to bag'}
      </button>

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
