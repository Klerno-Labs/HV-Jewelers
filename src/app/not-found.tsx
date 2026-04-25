import Link from 'next/link'
import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Not in the archive',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <Container className="py-32 md:py-40" width="reading">
      <p className="text-eyebrow text-bronze">Not in the archive</p>
      <h1 className="mt-8 font-serif text-display-lg italic font-light text-ink">
        That page is not part of the house.
      </h1>
      <p className="mt-8 max-w-xl text-subtitle leading-relaxed text-ink-soft">
        The link may be old, or the page may have been retired as the
        archive evolved. Below are a few good places to begin.
      </p>

      <div className="hv-gold-rule my-12 w-16" />

      <ul className="space-y-3 text-body">
        <li>
          <Link
            href="/"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
          >
            The Home →
          </Link>
        </li>
        <li>
          <Link
            href="/collections/new-arrivals"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
          >
            New Arrivals →
          </Link>
        </li>
        <li>
          <Link
            href="/journal"
            className="text-ink underline underline-offset-4 decoration-bronze/60 hover:text-olive hover:decoration-olive"
          >
            The Journal →
          </Link>
        </li>
        <li>
          <Link
            href="/contact"
            className="text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
          >
            Concierge
          </Link>
        </li>
      </ul>
    </Container>
  )
}
