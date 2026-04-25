import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { Container } from '@/components/layout/container'
import { ProductCard, type ProductCardData } from './product-card'
import { FadeIn } from './fade-in'

const TONE_CLASSES = {
  // World 01 — Vintage Era: terracotta clay over temple stone.
  cedar:
    'bg-[radial-gradient(ellipse_at_bottom_right,color-mix(in_srgb,var(--color-greek-terracotta)_60%,var(--color-cedar-soft))_0%,var(--color-temple-stone)_72%)]',
  // World 03 — Modern Fine: sun-gold heritage glow.
  bronze:
    'bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-sun-gold)_55%,var(--color-bronze))_0%,var(--color-temple-stone)_72%)]',
  // Generic warm secondary surface — kept parchment-leaning so it can sit
  // next to a louder world without competing.
  parchment:
    'bg-[radial-gradient(ellipse_at_top_left,var(--color-parchment-warm)_0%,var(--color-temple-stone)_72%)]',
} as const

export interface WorldFeatureProps {
  eyebrow: string
  title: string
  body: string
  href: string
  ctaLabel: string
  imageReversed?: boolean
  /// Visual tonality of the placeholder gradient when no image is given.
  tone?: keyof typeof TONE_CLASSES
  /// Optional editorial image (Cloudinary URL).
  image?: { url: string; alt: string; width: number; height: number } | null
  /// Optional product preview row beneath the lead.
  preview?: ProductCardData[]
}

export function WorldFeature({
  eyebrow,
  title,
  body,
  href,
  ctaLabel,
  imageReversed = false,
  tone = 'parchment',
  image = null,
  preview = [],
}: WorldFeatureProps) {
  return (
    <section className="border-t border-limestone-deep/60">
      <Container className="py-20 md:py-28">
        <div
          className={cn(
            'grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16',
            imageReversed && 'lg:[&>:first-child]:order-last',
          )}
        >
          <FadeIn className="relative aspect-[4/5] overflow-hidden lg:aspect-[5/6]">
            {image ? (
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className={cn('absolute inset-0', TONE_CLASSES[tone])}
              />
            )}
          </FadeIn>

          <FadeIn delay={150} className="max-w-xl">
            <p className="text-eyebrow text-bronze">{eyebrow}</p>
            <h2 className="mt-5 font-serif text-display text-ink">{title}</h2>
            <p className="mt-7 text-subtitle leading-relaxed text-ink-soft">
              {body}
            </p>
            <Link
              href={href}
              className="mt-10 inline-block text-caption tracking-wide text-ink underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive hover:decoration-olive"
            >
              {ctaLabel} →
            </Link>
          </FadeIn>
        </div>

        {preview.length > 0 ? (
          <FadeIn className="mt-20 border-t border-limestone-deep/60 pt-12">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
              {preview.map((p) => (
                <li key={p.slug}>
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
