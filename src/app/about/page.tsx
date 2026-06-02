import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'

export const metadata: Metadata = {
  title: 'About',
  description:
    'HV Jewelers (Hoang Vi) — a small collection of fine jewelry, chosen and verified in person.',
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
            <p className="text-eyebrow text-bronze">About · Hoang Vi</p>
            <h1 className="mt-10 font-serif text-display-lg italic font-light leading-[1.05] text-ink">
              A small house, kept on purpose.
            </h1>
            <p className="mt-10 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              HV Jewelers (Hoang Vi) is a small collection of fine
              jewelry — chosen, examined, and described in person by a
              working jeweler. We keep it small on purpose.
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
              {/* TODO [Hoang Vi's real story] — this is the $1k+ trust anchor.
                  Replace this placeholder with her actual origin: who she is
                  as a jeweler, how HV began, why fine jewelry. No invented
                  backstory ships. */}
              <p>
                Hoang Vi is a jeweler. HV Jewelers brings a small, edited
                part of that work online — fine jewelry chosen one piece at
                a time, examined in person, and described plainly.
              </p>
              <p>
                <em className="font-serif text-ink">HV Jewelers</em> is not
                trying to be a department store. We keep the catalog small,
                we describe each piece honestly, and we&apos;d rather lose a
                sale than oversell something.
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
              body="We tell you what the metal is, what the stone is, and how the piece is made. Plain words, no inflation."
            />
            <Principle
              number="02"
              title="Verified in person."
              body="Every piece is examined in person before it goes on the site — the metal, the stone, the finish. We describe what we actually see, not invented provenance."
            />
            <Principle
              number="03"
              title="Plain about the rules."
              body="Most pieces are eligible for a 15-day return in original, unused condition. Custom, engraved, and resized pieces are final sale. We say it on the product page so there are no surprises."
            />
          </FadeIn>
        </Container>
      </section>

      {/* ─── What we carry ─── */}
      <section className="border-t border-limestone-deep/60 bg-limestone/40">
        <Container className="py-24 md:py-32">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">What we carry</p>
            <h2 className="mt-6 max-w-2xl font-serif text-display text-ink">
              A small, fine-jewelry collection.
            </h2>
          </FadeIn>
          {/* TODO [merch] — the final section taxonomy is a Shopify-tag
              decision (vision §8). These are placeholder fine-jewelry
              categories; confirm against the real catalog. */}
          <FadeIn delay={150} className="mt-16 grid gap-10 md:grid-cols-2">
            <WorldRow
              eyebrow="01"
              title="Rings & Bands"
              body="Signets, bands, solitaires, and everyday gold. Verified in person before we list them."
              href="/shop"
            />
            <WorldRow
              eyebrow="02"
              title="Necklaces & Chain"
              body="Fine chain and pendants, described plainly — the metal, the weight, the clasp."
              href="/shop"
            />
            <WorldRow
              eyebrow="03"
              title="Stones"
              body="Loose and set stones, with what we can verify about each one stated plainly."
              href="/shop"
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
          {/* TODO [Hoang Vi's real story] — the real sourcing/craft substance
              (where pieces come from, how they are made or selected) is the
              $1k+ trust anchor. This is a truthful-minimal placeholder; no
              invented sourcing ships. */}
          <FadeIn delay={150} className="mt-12 space-y-6 text-body leading-[1.8] text-ink-soft">
            <p>
              Every piece is chosen one at a time and examined before it
              goes on the site. If we can&apos;t verify a claim about a
              piece, we don&apos;t make it.
            </p>
            <p>
              Resizing is offered where the geometry allows; we&apos;ll
              quote it per piece.
            </p>
          </FadeIn>
          <FadeIn delay={200} className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-limestone-deep/60 pt-8">
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
