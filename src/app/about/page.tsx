import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'

export const metadata: Metadata = {
  title: 'About',
  description:
    'HV Jewelers (Hoang Vi) — a family jeweler since 2005. Gold and fine jewelry, one of each piece, ready to wear and shipped to your door.',
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
              A family jeweler since 2005.
            </h1>
            <p className="mt-10 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              HV Jewelers (Hoang Vi) has been a family jewelry store since
              2005. Today we bring that same selection online: gold and
              fine jewelry — chains, necklaces, bracelets, earrings, and
              pendants — ready to wear and shipped to your door. We only
              ever stock one of each piece.
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
                Hoang Vi opened in 2005 as a family jewelry store, and the
                same family still picks every piece. We know gold, we know
                the makers we buy from, and we&apos;ve spent a long time
                learning what wears well and what doesn&apos;t.
              </p>
              <p>
                <em className="font-serif text-ink">HV Jewelers</em> is that
                store, online. We&apos;re not trying to be a department
                store. We keep the catalog small, we describe each piece
                honestly, and we&apos;d rather lose a sale than oversell
                something.
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
              title="One of each."
              body="We only ever stock one of every piece. When it's gone, it's gone — so what you see is what's actually here, never a stock photo of something we'll reorder."
            />
            <Principle
              number="02"
              title="Plain about the piece."
              body="We tell you the metal, the weight, and the measurements first. Real photos that look like the piece in your hand, plain words, no invented stories. If we can't verify a claim, we don't make it."
            />
            <Principle
              number="03"
              title="Plain about returns."
              body="Unworn pieces have a 15-day return window in original condition. Earrings are final sale for hygiene. We say it on every product page so there are no surprises."
            />
          </FadeIn>
        </Container>
      </section>

      {/* ─── Categories ─── */}
      <section className="border-t border-limestone-deep/60 bg-limestone/40">
        <Container className="py-24 md:py-32">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">The collection</p>
            <h2 className="mt-6 max-w-2xl font-serif text-display text-ink">
              What we carry.
            </h2>
          </FadeIn>
          <FadeIn delay={150} className="mt-16 grid gap-10 md:grid-cols-2">
            <WorldRow
              eyebrow="01"
              title="Gold Chains & Necklaces"
              body="Solid gold chains and necklaces — the pieces you reach for every day. Photographed and checked by hand before they go on the site."
              href="/shop"
            />
            <WorldRow
              eyebrow="02"
              title="Bracelets & Earrings"
              body="Bracelets, studs, hoops, and drops in gold and fine metals. Finished, ready to wear, ready to ship."
              href="/shop"
            />
            <WorldRow
              eyebrow="03"
              title="Pendants & Rings"
              body="Pendants and finished rings, sized as listed. Simple, well-made pieces you'll keep wearing."
              href="/shop"
            />
          </FadeIn>
        </Container>
      </section>

      {/* ─── How we work ─── */}
      <section className="border-t border-limestone-deep/60 bg-parchment">
        <Container className="py-24 md:py-32" width="reading">
          <FadeIn>
            <p className="text-eyebrow text-ink-muted">How it ships</p>
            <h2 className="mt-6 font-serif text-display text-ink">
              From our case to your door.
            </h2>
          </FadeIn>
          <FadeIn delay={150} className="mt-12 space-y-6 text-body leading-[1.8] text-ink-soft">
            <p>
              We work directly with makers and suppliers we&apos;ve trusted
              for years. Every piece is inspected before it goes on the
              site — if we can&apos;t stand behind it, we don&apos;t list
              it.
            </p>
            <p>
              Orders ship from our store fully insured, signature required,
              usually within a day or two. If something isn&apos;t right,
              you have 15 days to send unworn pieces back; you cover the
              insured return shipping. Need a ring sized or a piece looked
              after later? We can help with that too.
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
