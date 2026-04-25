'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

/**
 * App-router error boundary for render errors inside the main layout.
 * Rendered inside the normal chrome (header/footer) so the brand frame
 * survives even when a server component throws.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[render-error]', error)
  }, [error])

  return (
    <Container className="py-24 md:py-32" width="reading">
      <p className="text-eyebrow text-bronze">Something went briefly wrong</p>
      <h1 className="mt-6 font-serif text-display italic font-light text-ink">
        Hold on, we&apos;re fixing it.
      </h1>
      <p className="mt-8 max-w-xl text-body leading-relaxed text-ink-soft">
        The page couldn&apos;t load. Try again, or head back to the
        archive. Our team has been notified.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center bg-ink px-6 text-caption text-parchment transition-opacity hover:opacity-85"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center border border-ink/30 px-6 text-caption text-ink hover:border-olive hover:text-olive"
        >
          Go home
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-12 font-mono text-caption text-ink-muted">
          Reference: {error.digest}
        </p>
      ) : null}
    </Container>
  )
}
