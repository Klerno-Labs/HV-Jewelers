import { cn } from '@/lib/cn'
import type { CollectionMeta } from '@/lib/store/collections'

export function CollectionHero({
  meta,
  count,
  className,
}: {
  meta: CollectionMeta
  count: number
  className?: string
}) {
  return (
    <section className={cn('relative overflow-hidden', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[60%]"
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,var(--color-limestone-deep)_0%,var(--color-parchment)_55%,transparent_85%)]" />
      </div>
      <div className="py-16 md:py-24">
        <p className="text-eyebrow text-bronze">{meta.eyebrow}</p>
        <h1 className="mt-6 max-w-4xl font-serif text-display-lg text-ink">
          {meta.title}
        </h1>
        <p className="mt-8 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
          {meta.intro}
        </p>
        {meta.notes ? (
          <p className="mt-4 max-w-2xl text-caption text-ink-muted">
            {meta.notes}
          </p>
        ) : null}
        <p className="mt-10 text-eyebrow text-ink-muted">
          {count === 0
            ? 'Building this collection now.'
            : count === 1
              ? '1 piece'
              : `${count} pieces`}
        </p>
      </div>
    </section>
  )
}
