import Link from 'next/link'
import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Design System',
  robots: { index: false, follow: false },
}

export default function StylePage() {
  return (
    <Container className="py-20" width="reading">
      <p className="text-eyebrow text-bronze">Internal · Design System</p>
      <h1 className="mt-8 font-serif text-display text-ink">The HV Reference</h1>
      <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
        The reference surface for HV Jewelers: tokens, type, and material.
        Internal spec only; not customer-facing.
      </p>

      <div className="hv-gold-rule my-16 w-24" />

      <dl className="grid gap-8 md:grid-cols-2">
        <ReferenceCard
          href="/typography"
          eyebrow="01 · Typography"
          title="The Voice"
          body="Serif display paired with a refined sans. Scale, rhythm, and the eyebrow cap treatment."
        />
        <ReferenceCard
          href="/colors"
          eyebrow="02 · Color"
          title="The Palette"
          body="Earthy luxury: parchment and limestone grounds, olive and cedar core, bronze and antique gold as metals."
        />
      </dl>

      <section className="mt-20">
        <p className="text-eyebrow text-ink-muted">Principles</p>
        <ul className="mt-6 space-y-4 text-body text-ink-soft">
          <li>· Quiet before loud. Restraint is the brand.</li>
          <li>· Serif for voice. Sans for information.</li>
          <li>· Metals as ornament, not as ink.</li>
          <li>· Craft and material speak before provenance.</li>
          <li>· Never a cliché. Greek by restraint, not by column.</li>
        </ul>
      </section>
    </Container>
  )
}

function ReferenceCard({
  href,
  eyebrow,
  title,
  body,
}: {
  href: string
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="group block border border-limestone-deep/60 bg-limestone/40 p-8 transition-colors duration-300 hover:border-olive hover:bg-limestone/60"
    >
      <p className="text-eyebrow text-bronze">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-heading text-ink transition-colors duration-300 group-hover:text-olive">
        {title} <span aria-hidden>→</span>
      </h2>
      <p className="mt-3 text-body text-ink-soft">{body}</p>
    </Link>
  )
}
