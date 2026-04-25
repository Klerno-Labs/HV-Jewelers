import Link from 'next/link'

export function EmptyState({
  eyebrow = 'Quiet for now',
  title,
  body,
  action,
}: {
  eyebrow?: string
  title: string
  body: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="border border-limestone-deep/60 bg-parchment px-8 py-20 text-center">
      <p className="text-eyebrow text-bronze">{eyebrow}</p>
      <h2 className="mx-auto mt-6 max-w-xl font-serif text-heading text-ink">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-body leading-relaxed text-ink-soft">
        {body}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="mt-10 inline-block text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive hover:decoration-olive"
        >
          {action.label} →
        </Link>
      ) : null}
    </div>
  )
}
