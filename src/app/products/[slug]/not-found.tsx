import Link from 'next/link'
import { Container } from '@/components/layout/container'

export default function ProductNotFound() {
  return (
    <Container className="py-24" width="reading">
      <p className="text-eyebrow text-bronze">No longer in the archive</p>
      <h1 className="mt-6 font-serif text-display text-ink">
        That piece has found its next home.
      </h1>
      <p className="mt-6 text-body leading-relaxed text-ink-soft">
        Pieces in the archive are most often one-of-one. When something is
        sold, the listing is retired. New pieces are added every few weeks.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/collections/new-arrivals"
          className="text-caption text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
        >
          See New Arrivals
        </Link>
        <Link
          href="/contact"
          className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
        >
          Inquire after a similar piece
        </Link>
      </div>
    </Container>
  )
}
