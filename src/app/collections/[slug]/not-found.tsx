import Link from 'next/link'
import { Container } from '@/components/layout/container'

export default function CollectionNotFound() {
  return (
    <Container className="py-24" width="reading">
      <p className="text-eyebrow text-bronze">Not in the archive</p>
      <h1 className="mt-6 font-serif text-display text-ink">
        We could not find that collection.
      </h1>
      <p className="mt-6 text-body leading-relaxed text-ink-soft">
        The link may be old, or the collection may have been retired. The
        worlds below are the current set.
      </p>
      <ul className="mt-10 space-y-3 text-body">
        <li>
          <Link
            href="/collections/vintage-era"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
          >
            Vintage Era
          </Link>
        </li>
        <li>
          <Link
            href="/collections/jade"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
          >
            Jade
          </Link>
        </li>
        <li>
          <Link
            href="/collections/modern-fine-jewelry"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
          >
            Modern Fine Jewelry
          </Link>
        </li>
      </ul>
    </Container>
  )
}
