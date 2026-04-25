export function PlaceholderPanel({
  phase,
  title,
  body,
}: {
  phase: string
  title: string
  body: string
}) {
  return (
    <div className="border border-limestone-deep/60 bg-parchment p-10">
      <p className="text-eyebrow text-bronze">{phase}</p>
      <h2 className="mt-4 font-serif text-heading text-ink">{title}</h2>
      <p className="mt-4 max-w-xl text-body leading-relaxed text-ink-soft">
        {body}
      </p>
    </div>
  )
}
