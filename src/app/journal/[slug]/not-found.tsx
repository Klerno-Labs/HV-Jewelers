import Link from 'next/link'
import { Container } from '@/components/layout/container'

export default function JournalArticleNotFound() {
  return (
    <Container className="py-24" width="reading">
      <p className="text-eyebrow text-bronze">Not in the journal</p>
      <h1 className="mt-6 font-serif text-display text-ink">
        That entry has been retired or was never published.
      </h1>
      <p className="mt-6 text-body leading-relaxed text-ink-soft">
        We retire and revise journal entries from time to time as the
        archive evolves.
      </p>
      <p className="mt-10 text-caption text-ink-muted">
        <Link
          href="/journal"
          className="underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
        >
          See all entries →
        </Link>
      </p>
    </Container>
  )
}
