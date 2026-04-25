import { cn } from '@/lib/cn'

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('border-b border-limestone-deep/60 bg-parchment', className)}>
      <div className="px-10 py-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="text-eyebrow text-bronze">{eyebrow}</p>
            ) : null}
            <h1 className="mt-3 font-serif text-display text-ink">{title}</h1>
            {description ? (
              <p className="mt-3 text-body leading-relaxed text-ink-soft">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </header>
  )
}

export function AdminPageBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('px-10 py-10', className)}>{children}</div>
}
