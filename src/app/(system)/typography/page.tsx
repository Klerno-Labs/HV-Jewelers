import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Typography',
  robots: { index: false, follow: false },
}

const scale = [
  { name: 'display-lg', className: 'text-display-lg', usage: 'Hero statements. One per page.' },
  { name: 'display', className: 'text-display', usage: 'Section covers, editorial intros.' },
  { name: 'heading', className: 'text-heading', usage: 'Section headings.' },
  { name: 'title', className: 'text-title', usage: 'Card and module titles.' },
  { name: 'subtitle', className: 'text-subtitle', usage: 'Standfirst paragraphs, callouts.' },
  { name: 'body', className: 'text-body', usage: 'Long-form and UI body.' },
  { name: 'caption', className: 'text-caption', usage: 'Metadata, labels, fine print.' },
] as const

export default function TypographyPage() {
  return (
    <Container className="py-20">
      <p className="text-eyebrow text-bronze">Internal · 01 · Typography</p>
      <h1 className="mt-8 font-serif text-display text-ink">Typography</h1>
      <p className="mt-6 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
        Cormorant Garamond paired with Inter. The serif carries voice; the sans
        carries information. The scale is generous, never crowded. Italic is
        used sparingly for editorial sentiment.
      </p>

      <section className="mt-20">
        <div className="mb-8 flex items-baseline justify-between border-b border-limestone-deep/60 pb-4">
          <h2 className="font-serif text-heading text-ink">Serif Display</h2>
          <p className="text-eyebrow text-ink-muted">Cormorant Garamond</p>
        </div>
        <div className="space-y-10">
          {scale.map((s) => (
            <div
              key={`serif-${s.name}`}
              className="grid items-baseline gap-6 md:grid-cols-[180px_1fr]"
            >
              <div>
                <p className="font-mono text-caption text-ink">{s.name}</p>
                <p className="mt-1 text-eyebrow text-ink-muted/80">{s.usage}</p>
              </div>
              <p className={`${s.className} font-serif text-ink`}>
                Hong Vi Jewelers
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <div className="mb-8 flex items-baseline justify-between border-b border-limestone-deep/60 pb-4">
          <h2 className="font-serif text-heading text-ink">Sans UI</h2>
          <p className="text-eyebrow text-ink-muted">Inter</p>
        </div>
        <div className="space-y-10">
          {scale.map((s) => (
            <div
              key={`sans-${s.name}`}
              className="grid items-baseline gap-6 md:grid-cols-[180px_1fr]"
            >
              <div>
                <p className="font-mono text-caption text-ink">{s.name}</p>
              </div>
              <p className={`${s.className} font-sans text-ink`}>
                Considered, collected, and cared for.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <div className="mb-8 flex items-baseline justify-between border-b border-limestone-deep/60 pb-4">
          <h2 className="font-serif text-heading text-ink">Eyebrow</h2>
          <p className="text-eyebrow text-ink-muted">Sans · tracked caps</p>
        </div>
        <div className="space-y-6">
          <p className="text-eyebrow text-bronze">Archive · Fine · Gold · Pearls</p>
          <p className="text-eyebrow text-ink-muted">Sourcing · Craft · Provenance</p>
          <p className="text-caption text-ink-soft">
            Use the eyebrow for category, section, or editorial labeling. Never
            for body copy. Bronze for brand moments; ink-muted for internal.
          </p>
        </div>
      </section>

      <section className="mt-24">
        <div className="mb-8 flex items-baseline justify-between border-b border-limestone-deep/60 pb-4">
          <h2 className="font-serif text-heading text-ink">Editorial Paragraph</h2>
          <p className="text-eyebrow text-ink-muted">Sample at body size</p>
        </div>
        <div className="max-w-[65ch] space-y-4 text-body text-ink-soft">
          <p>
            The archive began quietly, from a small table in a back room.
            A handful of pieces chosen because they held their own
            language. Gold in its original weight. Settings older than
            the hands that made them.
          </p>
          <p>
            <em className="font-serif text-ink">Hong Vi</em>, the house
            behind HV Jewelers, is named for the collector who built it.
            Every piece is considered before it is listed, and cared for
            after it leaves.
          </p>
        </div>
      </section>
    </Container>
  )
}
