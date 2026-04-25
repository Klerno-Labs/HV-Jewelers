import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/layout/container'
import { FadeIn } from './fade-in'

export interface JournalPreviewItem {
  slug: string
  title: string
  excerpt: string | null
  publishedAt: Date | null
  heroImageUrl: string | null
}

const TONE_CLASSES = [
  'bg-[radial-gradient(ellipse_at_bottom_right,color-mix(in_srgb,var(--color-greek-terracotta)_50%,var(--color-cedar-soft))_0%,var(--color-temple-stone)_72%)]',
  'bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-greek-teal)_25%,var(--color-olive-soft))_0%,var(--color-temple-stone)_72%)]',
] as const

export function JournalPreview({ posts }: { posts: JournalPreviewItem[] }) {
  if (posts.length === 0) return null
  const featured = posts.slice(0, 2)
  return (
    <section className="border-t border-limestone-deep/60 bg-parchment-deep/40">
      <Container className="py-24 md:py-32">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-eyebrow text-ink-muted">From the Journal</p>
            <h2 className="mt-4 font-serif text-display text-ink">
              Notes from the archive.
            </h2>
          </div>
          <Link
            href="/journal"
            className="hidden text-caption tracking-wide text-ink-soft underline underline-offset-4 decoration-bronze/60 transition-colors duration-300 hover:text-olive md:inline"
          >
            All entries →
          </Link>
        </div>

        <ul className="mt-16 grid gap-12 md:grid-cols-2 lg:gap-20">
          {featured.map((post, i) => (
            <li key={post.slug}>
              <FadeIn delay={i === 0 ? 0 : 150} as="article">
                <Link href={`/journal/${post.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {post.heroImageUrl ? (
                      <Image
                        src={post.heroImageUrl}
                        alt={post.title}
                        width={1200}
                        height={900}
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className={`absolute inset-0 ${TONE_CLASSES[i % TONE_CLASSES.length]}`}
                      />
                    )}
                  </div>
                  <p className="mt-6 text-eyebrow text-ink-muted">
                    {post.publishedAt
                      ? post.publishedAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })
                      : ''}
                  </p>
                  <h3 className="mt-3 font-serif text-heading text-ink transition-colors duration-300 group-hover:text-olive">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-3 max-w-md text-body leading-relaxed text-ink-soft">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <p className="mt-5 text-caption tracking-wide text-ink-soft">
                    Continue reading →
                  </p>
                </Link>
              </FadeIn>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
