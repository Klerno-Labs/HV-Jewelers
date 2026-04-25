import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { ProductCard, type ProductCardData } from './product-card'
import { FadeIn } from './fade-in'

/**
 * Distinct visual treatment for the Jade world. Deep olive band, larger
 * editorial type, a small cluster of pieces, and a link into the journal
 * essay so jade lands as a serious category — not a marketing tag.
 */
export function JadeStory({
  pieces = [],
  essaySlug = null,
}: {
  pieces?: ProductCardData[]
  essaySlug?: string | null
}) {
  return (
    <section className="relative isolate overflow-hidden bg-olive-deep text-parchment">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,var(--color-greek-teal)_22%,var(--color-olive-soft))_0%,transparent_55%)]"
      />
      <Container className="py-28 md:py-40">
        <FadeIn className="max-w-3xl">
          <p className="text-eyebrow text-antique-gold-soft">On jade</p>
          <h2 className="mt-6 font-serif text-display-lg leading-tight text-parchment">
            Jade looks better the longer you wear it.
          </h2>
          <p className="mt-8 max-w-2xl text-subtitle leading-relaxed text-parchment-warm/85">
            It warms with skin contact and softens slowly over years.
            We tell you the type (jadeite vs. nephrite), whether it's been
            treated, and what we know about where it came from. Most jade
            is final sale. That's noted on every piece.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link
              href="/collections/jade"
              className="text-caption tracking-wide text-parchment underline underline-offset-4 decoration-antique-gold/70 transition-colors duration-300 hover:text-antique-gold-soft"
            >
              See the Jade →
            </Link>
            {essaySlug ? (
              <Link
                href={`/journal/${essaySlug}`}
                className="text-caption tracking-wide text-parchment-warm/80 underline underline-offset-4 decoration-antique-gold/40 transition-colors duration-300 hover:text-antique-gold-soft hover:decoration-antique-gold"
              >
                Read the essay
              </Link>
            ) : null}
          </div>
        </FadeIn>

        {pieces.length > 0 ? (
          <FadeIn delay={150} className="mt-20 border-t border-parchment/15 pt-14">
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {pieces.map((p) => (
                <li
                  key={p.slug}
                  className="[&_p.text-eyebrow]:text-antique-gold-soft [&_p.text-ink-muted]:text-parchment-warm/80 [&_p.font-serif]:text-parchment [&_span.text-ink-soft]:text-parchment-warm/80"
                >
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </FadeIn>
        ) : null}
      </Container>
    </section>
  )
}
