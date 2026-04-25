import Link from 'next/link'
import { cn } from '@/lib/cn'

/**
 * Admin filter bar — GET-method form so every filter state is a URL.
 * Server reads `searchParams`, no client JS. Includes a "Clear"
 * affordance and optional action slot on the right (export, bulk, etc.).
 */

export function AdminFilterBar({
  basePath,
  children,
  actions,
  className,
}: {
  basePath: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <form
      method="GET"
      action={basePath}
      className={cn(
        'grid gap-4 border-b border-limestone-deep/60 bg-parchment px-5 py-5 md:grid-cols-[1fr_auto]',
        className,
      )}
    >
      <div className="grid gap-3 md:grid-cols-4">{children}</div>
      <div className="flex items-center gap-2 md:justify-end">
        <button
          type="submit"
          className="h-9 bg-ink px-4 text-eyebrow text-parchment transition-opacity hover:opacity-85"
        >
          Apply
        </button>
        <Link
          href={basePath}
          className="inline-flex h-9 items-center px-3 text-eyebrow text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
        >
          Clear
        </Link>
        {actions ? <div className="ml-2 flex items-center gap-2">{actions}</div> : null}
      </div>
    </form>
  )
}

export function FilterText({
  name,
  label,
  defaultValue,
  placeholder,
  className,
}: {
  name: string
  label: string
  defaultValue?: string
  placeholder?: string
  className?: string
}) {
  const id = `filter-${name}`
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-eyebrow text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 block h-9 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-caption text-ink placeholder:text-ink-muted/60 focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
      />
    </div>
  )
}

export function FilterSelect({
  name,
  label,
  defaultValue,
  options,
  className,
}: {
  name: string
  label: string
  defaultValue?: string
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  const id = `filter-${name}`
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-eyebrow text-ink-muted">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        className="mt-2 block h-9 w-full border border-limestone-deep bg-parchment-warm/40 px-2 text-caption text-ink focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FilterDate({
  name,
  label,
  defaultValue,
  className,
}: {
  name: string
  label: string
  defaultValue?: string
  className?: string
}) {
  const id = `filter-${name}`
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-eyebrow text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="date"
        defaultValue={defaultValue}
        className="mt-2 block h-9 w-full border border-limestone-deep bg-parchment-warm/40 px-2 text-caption text-ink focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
      />
    </div>
  )
}
