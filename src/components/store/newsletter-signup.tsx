'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Pre-launch email capture. Posts to /api/subscribe, shows a quiet confirmation
 * on success, and (once the list has some size) a little social proof. Includes
 * a honeypot field to deflect bots. Designed to sit in the footer band, so it
 * stays small and self-contained.
 */
type Status = 'idle' | 'submitting' | 'success' | 'error'

export function NewsletterSignup({
  source = 'storefront-footer',
}: {
  source?: string
}) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<Status>('idle')
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/subscribe')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.count === 'number') setCount(d.count)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      })
      if (!r.ok) throw new Error('failed')
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-caption leading-relaxed text-ink-soft">
        You&apos;re on the list — we&apos;ll write when the collection opens.
      </p>
    )
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        {/* honeypot — hidden from people, catches bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
        />
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 flex-1 border border-ink/20 bg-transparent px-4 text-caption text-ink placeholder:text-ink-muted focus:border-greek-teal focus:outline-none"
        />
        <Button
          type="submit"
          variant="ink"
          size="md"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Joining…' : 'Join the list'}
        </Button>
      </form>
      {status === 'error' && (
        <p className="mt-3 text-caption text-bronze">
          Something went wrong — please try again.
        </p>
      )}
      {count !== null && count >= 25 && (
        <p className="mt-3 text-caption text-ink-muted">
          Join {count.toLocaleString()} others waiting for the first pieces.
        </p>
      )}
    </div>
  )
}
