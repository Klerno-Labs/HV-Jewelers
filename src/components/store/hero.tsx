import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/shopify/money'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Editorial hero. Layered grounds (an Aegean glow over a warm clay
 * wash), a serif headline that rises line-by-line on load, and a real
 * featured piece framed in the case — falling back to a terracotta
 * gradient when no product is configured yet, so the page is always
 * coherent.
 *
 * Motion is pure CSS (see globals.css `hv-rise` / `hv-unveil`): no
 * client JS, no inline styles, and prefers-reduced-motion snaps every
 * reveal to its end state. Stagger is set with arbitrary
 * `[animation-delay:Nms]` utilities, which compile to real classes.
 */
export function Hero({ feature }: { feature?: ShopifyProduct | null }) {
  const image = feature?.featuredImage ?? null

  return (
    <section
      aria-labelledby="intro-heading"
      className="relative overflow-hidden"
    >
      {/* ── Layered grounds ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full md:w-[58%]"
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-greek-teal)_18%,var(--color-limestone-deep))_0%,var(--color-parchment)_55%,transparent_85%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 -z-10 hidden h-[60%] w-[40%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-sun-gold)_22%,transparent)_0%,transparent_70%)] blur-2xl md:block"
      />
      {/* Drawn-in gold hairline along the top edge of the section. */}
      <div
        aria-hidden
        className="hv-gold-rule hv-draw absolute inset-x-0 top-0 opacity-70"
      />

      <Container className="grid gap-12 py-24 md:py-32 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:py-36">
        {/* ── Copy column ── */}
        <div>
          <p className="hv-rise flex items-center gap-3 text-eyebrow text-bronze [animation-delay:60ms]">
            <span aria-hidden className="h-px w-8 bg-bronze/50" />
            Hoang Vi Jewelers
          </p>

          <h1
            id="intro-heading"
            className="mt-9 max-w-[18ch] font-serif text-display-lg font-light italic leading-[1.02] text-ink"
          >
            <span className="block hv-rise [animation-delay:140ms]">
              Fine jewelry,
            </span>
            <span className="block hv-rise [animation-delay:240ms]">
              chosen and verified
            </span>
            <span className="block hv-rise [animation-delay:340ms]">
              in person.
            </span>
          </h1>

          <p className="hv-rise mt-9 max-w-xl text-subtitle leading-relaxed text-ink-soft [animation-delay:460ms]">
            Bands, solitaires, everyday gold, and stones — a small,
            considered collection, each piece looked at in person before
            it goes on the site.
          </p>

          <div className="hv-rise mt-11 flex flex-wrap items-center gap-x-4 gap-y-4 [animation-delay:560ms]">
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: 'primary', size: 'lg' }))}
            >
              Enter the shop
            </Link>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive hover:decoration-olive"
            >
              About the House
              <span
                aria-hidden
                className="transition-transform duration-300 ease-[var(--ease-editorial)] group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          {/* ── Quiet trust strip ── */}
          <ul className="hv-rise mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-6 text-eyebrow text-ink-muted [animation-delay:680ms]">
            <li>Verified in person</li>
            <li aria-hidden className="text-bronze/50">·</li>
            <li>Insured, signed-for shipping</li>
            <li aria-hidden className="text-bronze/50">·</li>
            <li>15-day returns</li>
          </ul>
        </div>

        {/* ── Featured piece — in the case ── */}
        <div className="hv-unveil relative aspect-4/5 overflow-hidden bg-limestone shadow-float lg:aspect-3/4 [animation-delay:300ms]">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? feature?.title ?? ''}
              width={image.width ?? 900}
              height={image.height ?? 1200}
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-full w-full object-cover scale-[1.3]"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,var(--color-greek-terracotta)_55%,var(--color-cedar-soft))_0%,var(--color-temple-stone)_55%,var(--color-parchment-warm)_100%)]"
            />
          )}

          {/* Hairline inner frame — sits the photo inside the case. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 border border-parchment/25"
          />

          {/* Editorial caption — the actual piece, or a quiet invite. */}
          {feature ? (
            <Link
              href={`/shop/${feature.handle}`}
              className="group absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 bg-parchment/90 px-4 py-3 backdrop-blur-sm transition-colors duration-300 hover:bg-parchment"
            >
              <span className="min-w-0">
                <span className="block text-eyebrow text-bronze">
                  Currently in the case
                </span>
                <span className="mt-1 block truncate font-serif text-title text-ink transition-colors duration-300 group-hover:text-olive-deep">
                  {feature.title}
                </span>
              </span>
              <span className="shrink-0 text-caption text-ink-soft tabular-nums">
                {formatMoney(feature.priceRange.minVariantPrice)}
              </span>
            </Link>
          ) : (
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
              <p className="font-serif text-eyebrow text-bronze">
                Currently in the case
              </p>
              <Link
                href="/shop"
                className="text-eyebrow text-bronze underline underline-offset-4 decoration-bronze/60 hover:text-olive"
              >
                Browse the shop →
              </Link>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
