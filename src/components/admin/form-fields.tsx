import { cn } from '@/lib/cn'

/**
 * Minimal form field primitives for admin mutation forms. No client JS
 * unless a form explicitly opts in.
 */

export function FormField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id?: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="block text-eyebrow text-ink-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="text-caption text-ink-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-caption text-cedar-deep">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({
  id,
  name,
  defaultValue,
  placeholder,
  required,
  type = 'text',
  minLength,
  maxLength,
  className,
}: {
  id?: string
  name: string
  defaultValue?: string | number
  placeholder?: string
  required?: boolean
  type?: 'text' | 'email' | 'url' | 'number'
  minLength?: number
  maxLength?: number
  className?: string
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      className={cn(
        'block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink placeholder:text-ink-muted/60 focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze',
        className,
      )}
    />
  )
}

export function Textarea({
  id,
  name,
  defaultValue,
  placeholder,
  rows = 4,
  maxLength,
  className,
}: {
  id?: string
  name: string
  defaultValue?: string
  placeholder?: string
  rows?: number
  maxLength?: number
  className?: string
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      defaultValue={defaultValue}
      placeholder={placeholder}
      maxLength={maxLength}
      className={cn(
        'block w-full border border-limestone-deep bg-parchment-warm/40 px-3 py-2 font-mono text-caption leading-relaxed text-ink placeholder:text-ink-muted/60 focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze',
        className,
      )}
    />
  )
}

export function Select({
  id,
  name,
  defaultValue,
  options,
  className,
}: {
  id?: string
  name: string
  defaultValue?: string
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className={cn(
        'block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-2 text-body text-ink focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Checkbox({
  id,
  name,
  defaultChecked,
  label,
  hint,
}: {
  id?: string
  name: string
  defaultChecked?: boolean
  label: string
  hint?: string
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 border-limestone-deep text-olive focus-visible:ring-2 focus-visible:ring-bronze"
      />
      <div>
        <p className="text-body text-ink">{label}</p>
        {hint ? <p className="mt-1 text-caption text-ink-muted">{hint}</p> : null}
      </div>
    </label>
  )
}
