'use client'

import { useEffect } from 'react'

/**
 * Last-resort error boundary — fires when even the root layout throws.
 * Must render its own <html>/<body> since the app shell is unavailable.
 * Intentionally spartan so nothing inside can also error.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '64px 24px',
          fontFamily:
            '"Cormorant Garamond", Georgia, "Times New Roman", serif',
          background: '#f2ebd7',
          color: '#1a1a17',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p
            style={{
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#8b6a3c',
              margin: '0 0 24px',
            }}
          >
            HV Jewelers
          </p>
          <h1
            style={{
              fontSize: 36,
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.15,
              margin: '0 0 16px',
            }}
          >
            We&apos;ll be back in a moment.
          </h1>
          <p
            style={{
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 15,
              lineHeight: 1.7,
              color: '#3a3a35',
              margin: '0 0 24px',
            }}
          >
            Something unexpected happened. Refresh the page, or write the
            concierge directly at{' '}
            <a
              href="mailto:concierge@hvjewelers.com"
              style={{ color: '#1a1a17' }}
            >
              concierge@hvjewelers.com
            </a>
            .
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 13,
              letterSpacing: '0.04em',
              padding: '12px 24px',
              background: '#1a1a17',
              color: '#f2ebd7',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
