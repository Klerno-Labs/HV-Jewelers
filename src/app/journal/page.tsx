import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Notes from us on jade, sourcing older pieces, materials, and how we work.',
}

const TONE_CLASSES = [
  'bg-[radial-gradient(ellipse_at_bottom_right,var(--color-cedar-soft)_0%,var(--color-limestone)_72%)]',
  'bg-[radial-gradient(ellipse_at_top_right,var(--color-olive-soft)_0%,var(--color-limestone)_72%)]',
  'bg-[radial-gradient(ellipse_at_top_left,var(--color-bronze)_0%,var(--color-limestone)_72%)]',
  'bg-[radial-gradient(ellipse_at_bottom_left,var(--color-parchment-warm)_0%,var(--color-limestone)_72%)]',
] as const

async function loadPosts() {
  return prisma.editorialPost
    .findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 24,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        heroImageUrl: true,
      },
    })
    .catch(() => [])
}

export default async function JournalPage() {
  const posts = await loadPosts()
  const [featured, ...rest] = posts

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[55%]"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,var(--color-olive-soft)_0%,var(--color-parchment)_55%,transparent_85%)]" />
        </div>
        <Container className="py-20 md:py-28">
          <FadeIn className="max-w-3xl">
            <p className="text-eyebrow text-bronze">Journal</p>
            <h1 className="mt-8 font-serif text-display-lg italic font-light text-ink">
              Notes from us.
            </h1>
            <p className="mt-8 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
              Pieces about jade, sourcing older pieces, materials, and
              how we work. New entries every few weeks. No newsletter.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ─── Body ─── */}
      <section className="border-t border-limestone-deep/60">
        <Container className="py-16 md:py-24">
          {posts.length === 0 ? (
            <div className="border border-limestone-deep/60 bg-parchment p-10">
              <p className="text-eyebrow text-bronze">In progress</p>
              <h2 className="mt-4 font-serif text-heading text-ink">
                The journal is being written.
              </h2>
              <p className="mt-4 max-w-xl text-body leading-relaxed text-ink-soft">
                We&apos;re preparing the first set of entries: on jade,
                on signets, and on what we choose to keep.
              </p>
            </div>
          ) : (
            <>
              {featured ? (
                <FadeIn>
                  <Link href={`/journal/${featured.slug}`} className="group block">
                    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16">
                      <div className="relative aspect-4/3 overflow-hidden lg:aspect-3/2">
                        {featured.heroImageUrl ? (
                          <Image
                            src={featured.heroImageUrl}
                            alt={featured.title}
                            width={1600}
                            height={1200}
                            sizes="(min-width: 1024px) 60vw, 100vw"
                            className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className={`absolute inset-0 ${TONE_CLASSES[0]}`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-eyebrow text-ink-muted">
                          {featured.publishedAt
                            ? featured.publishedAt.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                              })
                            : ''}
                          {' · Featured'}
                        </p>
                        <h2 className="mt-4 font-serif text-display text-ink transition-colors duration-300 group-hover:text-olive">
                          {featured.title}
                        </h2>
                        {featured.excerpt ? (
                          <p className="mt-5 max-w-md text-body leading-relaxed text-ink-soft">
                            {featured.excerpt}
                          </p>
                        ) : null}
                        <p className="mt-7 text-caption tracking-wide text-ink-soft">
                          Continue reading →
                        </p>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ) : null}

              {rest.length > 0 ? (
                <FadeIn className="mt-24 border-t border-limestone-deep/60 pt-16">
                  <p className="text-eyebrow text-ink-muted">More entries</p>
                  <ul className="mt-10 grid gap-12 md:grid-cols-2 lg:gap-16">
                    {rest.map((p, i) => (
                      <li key={p.slug}>
                        <article>
                          <Link href={`/journal/${p.slug}`} className="group block">
                            <div className="relative aspect-4/3 overflow-hidden">
                              {p.heroImageUrl ? (
                                <Image
                                  src={p.heroImageUrl}
                                  alt={p.title}
                                  width={1200}
                                  height={900}
                                  sizes="(min-width: 768px) 50vw, 100vw"
                                  className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div
                                  aria-hidden
                                  className={`absolute inset-0 ${TONE_CLASSES[(i + 1) % TONE_CLASSES.length]}`}
                                />
                              )}
                            </div>
                            <p className="mt-5 text-eyebrow text-ink-muted">
                              {p.publishedAt
                                ? p.publishedAt.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                  })
                                : ''}
                            </p>
                            <h3 className="mt-3 font-serif text-heading text-ink transition-colors duration-300 group-hover:text-olive">
                              {p.title}
                            </h3>
                            {p.excerpt ? (
                              <p className="mt-3 max-w-md text-body leading-relaxed text-ink-soft">
                                {p.excerpt}
                              </p>
                            ) : null}
                          </Link>
                        </article>
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              ) : null}
            </>
          )}
        </Container>
      </section>
    </>
  )
}
