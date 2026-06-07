import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'

export const metadata: Metadata = {
  title: 'About',
  description:
    'HV Jewelers — a small, family-owned business focused on quality. Every piece is hand-picked, and we sell online only.',
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
            <p className="text-eyebrow text-bronze">About · HV Jewelers</p>
            <h1 className="mt-10 font-serif text-display-lg italic font-light leading-[1.05] text-ink">
              A small, family-owned jeweler.
            </h1>
            <p className="mt-10 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              We&apos;re a small, family-owned business with one simple
              focus: quality. Every piece is hand-picked, and we sell
              online only — so our attention stays on the jewelry and the
              people we make it for.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ─── Who we are ─── */}
      <section className="border-t border-limestone-deep/60 bg-parchment">
        <Container className="py-24 md:py-32" width="reading">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">Who we are</p>
            <h2 className="mt-6 font-serif text-display text-ink">
              A family that cares about quality.
            </h2>
            <div className="mt-12 space-y-6 text-body leading-[1.8] text-ink-soft">
              <p>
                HV Jewelers is a small, family-owned business. We care about
                quality above everything, and we hand-pick every piece in
                the collection ourselves. Our goal is simple: to deliver the
                quality you&apos;re looking for.
              </p>
              <p>
                We sell online only, and we keep a low profile on purpose —
                our focus is the jewelry, not the spotlight. What you see
                here is what we&apos;d be proud to wear ourselves.
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
              title="Hand-picked."
              body="Every piece is chosen by hand. If it isn't something we'd be proud to own, it doesn't make the collection."
            />
            <Principle
              number="02"
              title="Quality first."
              body="Real gold, natural stones, and honest descriptions. Our goal is to deliver exactly the quality you're looking for."
            />
            <Principle
              number="03"
              title="Plain about the rules."
              body="Most pieces are eligible for a 15-day return in original, unused condition. Custom, engraved, and resized pieces are final sale — and we say so on the product page, so there are no surprises."
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
          <FadeIn delay={150} className="mt-16 grid gap-10 md:grid-cols-2">
            <WorldRow
              eyebrow="01"
              title="Necklaces & Pendants"
              body="Natural diamond and jade set in solid gold — described plainly, by the metal, the stones, and the weight."
              href="/shop"
            />
            <WorldRow
              eyebrow="02"
              title="Earrings"
              body="Studs and hoops in natural jade and diamond, hand-set in 18-karat gold."
              href="/shop"
            />
            <WorldRow
              eyebrow="03"
              title="Bracelets"
              body="Color and brilliance for the wrist — natural diamond paired with rare stones like tanzanite."
              href="/shop"
            />
          </FadeIn>
        </Container>
      </section>

      {/* ─── How we choose ─── */}
      <section className="border-t border-limestone-deep/60 bg-parchment">
        <Container className="py-24 md:py-32" width="reading">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">How we choose</p>
            <h2 className="mt-6 font-serif text-display text-ink">
              Chosen one piece at a time.
            </h2>
          </FadeIn>
          <FadeIn delay={150} className="mt-12 space-y-6 text-body leading-[1.8] text-ink-soft">
            <p>
              Every piece is hand-picked for its quality before it goes on
              the site. If we can&apos;t stand behind a claim about a piece,
              we don&apos;t make it — we&apos;d rather lose a sale than
              oversell something.
            </p>
            <p>
              Each item is one of a kind and ships fully insured. Resizing
              is offered where the design allows; we&apos;ll quote it per
              piece.
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
