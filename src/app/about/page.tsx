import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'

export const metadata: Metadata = {
  title: 'About',
  description:
    'HV Jewelers (Hong Vi). A small archive of unworn Vintage Era, Near Vintage, and modern fine jewelry.',
}

export default function AboutPage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[55%]"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,var(--color-cedar-soft)_0%,var(--color-parchment)_55%,transparent_85%)]" />
        </div>
        <Container className="py-24 md:py-32">
          <FadeIn className="max-w-3xl">
            <p className="text-eyebrow text-bronze">About · Hong Vi</p>
            <h1 className="mt-10 font-serif text-display-lg italic font-light leading-[1.05] text-ink">
              A small house, kept on purpose.
            </h1>
            <p className="mt-10 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              HV Jewelers (Hong Vi) is a small archive of unworn jewelry:
              vintage, near-vintage, and modern fine pieces. Some were
              made decades ago and stored, never sold. Others are made
              on the bench today. Either way, they come to you new.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ─── Origin ─── */}
      <section className="border-t border-limestone-deep/60 bg-parchment">
        <Container className="py-24 md:py-32" width="reading">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">Origin</p>
            <h2 className="mt-6 font-serif text-display text-ink">
              How the house started.
            </h2>
            <div className="mt-12 space-y-6 text-body leading-[1.8] text-ink-soft">
              <p>
                Hong Vi started collecting from estate dealers and small
                workshops across Asia: signets from the Vintage Era that
                had sat in drawers for decades, fine chain that had been
                made and never sold, and pieces from suppliers who had
                been holding inventory through families for years. None
                of it had been worn.
              </p>
              <p>
                <em className="font-serif text-ink">HV Jewelers</em> grew
                from that. We&apos;re not trying to be a department store. We
                keep the catalog small, we describe each piece honestly,
                and we&apos;d rather lose a sale than oversell something.
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ─── Philosophy ─── */}
      <section className="border-t border-limestone-deep/60">
        <Container className="py-24 md:py-32">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">How we work</p>
            <h2 className="mt-6 max-w-2xl font-serif text-display text-ink">
              Three things we stick to.
            </h2>
          </FadeIn>
          <FadeIn delay={150} className="mt-16 grid gap-12 md:grid-cols-3">
            <Principle
              number="01"
              title="Material first."
              body="A lot of what we sell is unsigned. We tell you what the metal is, what the stone is, and how the piece was put together. Plain words, not invented provenance."
            />
            <Principle
              number="02"
              title="Unworn, every piece."
              body="Whether it was made in 1952 or last month, nothing in the catalog has been worn. Older pieces come from estates and workshops where they were stored on a shelf, never sold. That's harder to find than the Vintage Era usually delivers, and it's the part we're most proud of."
            />
            <Principle
              number="03"
              title="Plain about the rules."
              body="Vintage Era and Near Vintage pieces are final sale. Modern Fine pieces have a 15-day return window for unworn returns. We say it on the product page so there are no surprises."
            />
          </FadeIn>
        </Container>
      </section>

      {/* ─── Four worlds ─── */}
      <section className="border-t border-limestone-deep/60 bg-limestone/40">
        <Container className="py-24 md:py-32">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">The collections</p>
            <h2 className="mt-6 max-w-2xl font-serif text-display text-ink">
              Three sections of the catalog.
            </h2>
          </FadeIn>
          <FadeIn delay={150} className="mt-16 grid gap-10 md:grid-cols-2">
            <WorldRow
              eyebrow="01"
              title="Vintage Era"
              body="Older-era pieces that were made decades ago and never sold. Verified in person before we list them. Final sale; described plainly."
              href="/collections/vintage-era"
            />
            <WorldRow
              eyebrow="02"
              title="Near Vintage"
              body="Pieces from the late twentieth century. Often unsigned, all unworn. Final sale."
              href="/collections/near-vintage"
            />
            <WorldRow
              eyebrow="03"
              title="Modern Fine Jewelry"
              body="New pieces made on the bench. Bands, solitaires, everyday gold. Most are eligible for a 15-day return on unworn returns. Resizing voids that window."
              href="/collections/modern-fine-jewelry"
            />
          </FadeIn>
        </Container>
      </section>

      {/* ─── Sourcing & craft ─── */}
      <section className="border-t border-limestone-deep/60 bg-parchment">
        <Container className="py-24 md:py-32" width="reading">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">Sourcing</p>
            <h2 className="mt-6 font-serif text-display text-ink">
              Where it comes from.
            </h2>
          </FadeIn>
          <FadeIn delay={150} className="mt-12 space-y-6 text-body leading-[1.8] text-ink-soft">
            <p>
              Our older pieces come from estate sources and small
              workshops in Asia and Europe that have been holding inventory
              for years (sometimes decades). We work with a short list of
              dealers we trust. Each piece is examined and tested where
              appropriate before it goes on the site. If we can&apos;t
              verify a claim about a piece, we don&apos;t make it.
            </p>
            <p>
              Modern Fine pieces are made on a bench we work with directly.
              Resizing is offered on pieces where the geometry allows.
              Vintage Era and Near Vintage pieces are typically sized as
              made; we&apos;ll quote resizing only when it can be done
              without damaging the piece.
            </p>
          </FadeIn>
          <FadeIn delay={200} className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-limestone-deep/60 pt-8">
            <Link
              href="/journal"
              className="text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors hover:text-olive hover:decoration-olive"
            >
              Read the Journal →
            </Link>
            <Link
              href="/care"
              className="text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/40 transition-colors hover:text-olive hover:decoration-olive"
            >
              Care &amp; Resizing
            </Link>
          </FadeIn>
        </Container>
      </section>

      <ConciergeClose />
    </>
  )
}

function Principle({
  number,
  title,
  body,
}: {
  number: string
  title: string
  body: string
}) {
  return (
    <article>
      <p className="font-serif text-eyebrow text-bronze">{number}</p>
      <h3 className="mt-4 font-serif text-heading text-ink">{title}</h3>
      <p className="mt-5 text-body leading-relaxed text-ink-soft">{body}</p>
    </article>
  )
}

function WorldRow({
  eyebrow,
  title,
  body,
  href,
  accent = 'cedar',
}: {
  eyebrow: string
  title: string
  body: string
  href: string
  accent?: 'cedar' | 'olive'
}) {
  return (
    <Link
      href={href}
      className="group block border border-limestone-deep/60 bg-parchment p-8 transition-colors duration-300 hover:border-olive"
    >
      <p
        className={`text-eyebrow ${accent === 'olive' ? 'text-olive' : 'text-bronze'}`}
      >
        {eyebrow}
      </p>
      <h3 className="mt-4 font-serif text-heading text-ink transition-colors duration-300 group-hover:text-olive-deep">
        {title}
      </h3>
      <p className="mt-4 max-w-md text-body leading-relaxed text-ink-soft">
        {body}
      </p>
      <p className="mt-6 text-caption tracking-wide text-ink-soft transition-colors duration-300 group-hover:text-olive">
        Enter →
      </p>
    </Link>
  )
}
