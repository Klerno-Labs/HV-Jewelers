import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { FadeIn } from './fade-in'

/**
 * Editorial showpiece block for the Jade collection page.
 *
 * Used decoratively while the piece is photographed, written up, and
 * priced. Carries no product schema and no add-to-bag — the only path
 * forward is the concierge link, which keeps inquiries warm without
 * pretending the listing is live.
 *
 * Visual: necklace floats over a sun-gold halo, terracotta + teal
 * accents tied to the Phase Colors palette. The halo sits on a
 * pointer-events-none, -z layer so the image and copy stay interactive.
 */
export function JadeShowpiece() {
  return (
    <section
      aria-label="A piece in residence"
      className="relative isolate overflow-hidden border-y border-greek-terracotta/25 bg-parchment"
    >
      {/* Sun-gold halo behind the necklace — heritage glow, low opacity. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute right-[-10%] top-1/2 h-[120%] w-[80%] -translate-y-1/2 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-sun-gold)_28%,transparent)_0%,color-mix(in_srgb,var(--color-greek-teal)_8%,transparent)_45%,transparent_70%)]" />
        <div className="absolute left-[-10%] bottom-[-20%] h-[60%] w-[50%] bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-greek-teal)_14%,transparent)_0%,transparent_60%)]" />
      </div>

      <Container className="grid items-center gap-10 py-20 md:py-24 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <FadeIn>
          <p className="inline-flex items-center gap-2 text-eyebrow text-murex-purple">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-murex-purple"
            />
            Coming soon · Not yet listed
          </p>

          <h2 className="mt-6 max-w-md font-serif text-display italic font-light leading-[1.1] text-ink">
            A green jade pendant, on its way.
          </h2>

          <p className="mt-8 max-w-md text-subtitle leading-relaxed text-ink-soft">
            A jadeite cabochon set into rose-gold filigree, strung on
            deep-green beads. Unworn. We&apos;re finishing the writeup
            (type, weight, what we know about it) before it goes live.
          </p>

          <p className="mt-6 max-w-md text-caption leading-relaxed text-ink-muted">
            Want to be notified when it lists, or to ask about it before
            it goes up? Send a note.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link
              href="/contact"
              className="text-caption tracking-wide text-greek-teal-deep underline underline-offset-4 decoration-greek-teal/60 transition-colors duration-300 hover:text-greek-teal hover:decoration-greek-teal"
            >
              Inquire about this piece →
            </Link>
            <Link
              href="/journal/on-jade"
              className="text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/40 transition-colors duration-300 hover:text-greek-teal-deep hover:decoration-greek-teal"
            >
              Read the essay
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            {/* Soft circular halo directly behind the pendant */}
            <div
              aria-hidden
              className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-sun-gold)_42%,transparent)_0%,transparent_62%)]"
            />
            <Image
              src="/jade/necklace.png"
              alt="Imperial-green jadeite pendant on a strand of green beads"
              width={1024}
              height={832}
              priority
              sizes="(min-width: 1024px) 520px, 90vw"
              className="relative h-full w-full object-contain drop-shadow-[0_22px_44px_rgb(112_53_41_/_0.18)]"
            />
          </div>
        </FadeIn>
      </Container>
    </section>
  )
}
