import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { Container } from '@/components/layout/container'
import { Breadcrumbs } from '@/components/store/breadcrumbs'
import { FadeIn } from '@/components/store/fade-in'
import { ConciergeClose } from '@/components/store/concierge-close'
import { EditorialProse } from '@/components/store/editorial-prose'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function loadPost(slug: string) {
  return prisma.editorialPost
    .findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        body: true,
        heroImageUrl: true,
        publishedAt: true,
        metaTitle: true,
        metaDescription: true,
        author: { select: { name: true } },
      },
    })
    .catch(() => null)
}

async function loadNeighbors(currentPublishedAt: Date | null) {
  // We use publishedAt as the ordering key. If a post has no publishedAt
  // (shouldn't, since it's PUBLISHED), we don't show neighbors.
  if (!currentPublishedAt) return { previous: null, next: null }
  const [previous, next] = await Promise.all([
    prisma.editorialPost.findFirst({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lt: currentPublishedAt },
      },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true },
    }),
    prisma.editorialPost.findFirst({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gt: currentPublishedAt },
      },
      orderBy: { publishedAt: 'asc' },
      select: { slug: true, title: true },
    }),
  ])
  return { previous, next }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) return {}
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,  }
}

export default async function JournalArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) notFound()

  const { previous, next } = await loadNeighbors(post.publishedAt)

  const dateLabel = post.publishedAt
    ? post.publishedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  // Article JSON-LD. Emit only when we have a date so the schema is valid.
  const ld = post.publishedAt
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        datePublished: post.publishedAt.toISOString(),
        author: post.author?.name
          ? { '@type': 'Person', name: post.author.name }
          : { '@type': 'Organization', name: 'HV Jewelers' },
        publisher: { '@type': 'Organization', name: 'HV Jewelers' },
      }
    : null

  return (
    <>
      <Container className="py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'HV Jewelers', href: '/' },
            { label: 'Journal', href: '/journal' },
            { label: post.title },
          ]}
        />
      </Container>

      {/* ─── Article hero ─── */}
      <article>
        <header className="border-b border-limestone-deep/60">
          <Container className="py-12 md:py-20" width="reading">
            <FadeIn>
              <p className="text-eyebrow text-bronze">
                The Journal {dateLabel ? `· ${dateLabel}` : ''}
              </p>
              <h1 className="mt-8 font-serif text-display-lg italic font-light leading-[1.05] text-ink">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-8 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
                  {post.excerpt}
                </p>
              ) : null}
            </FadeIn>
          </Container>

          {post.heroImageUrl ? (
            <FadeIn delay={150}>
              <div className="relative aspect-3/2 w-full overflow-hidden">
                <Image
                  src={post.heroImageUrl}
                  alt={post.title}
                  width={2400}
                  height={1600}
                  priority
                  sizes="100vw"
                  className="h-full w-full object-cover"
                />
              </div>
            </FadeIn>
          ) : null}
        </header>

        {/* ─── Article body ─── */}
        <Container className="py-16 md:py-24" width="reading">
          <FadeIn>
            <EditorialProse>{post.body}</EditorialProse>
          </FadeIn>
        </Container>

        {/* ─── Byline + neighbors ─── */}
        <section className="border-t border-limestone-deep/60 bg-parchment">
          <Container className="py-16" width="reading">
            <p className="text-eyebrow text-ink-muted">Written by</p>
            <p className="mt-3 font-serif text-title text-ink">
              {post.author?.name ?? 'Hong Vi'}
            </p>

            <div className="mt-12 grid gap-6 border-t border-limestone-deep/60 pt-8 md:grid-cols-2">
              {previous ? (
                <Link
                  href={`/journal/${previous.slug}`}
                  className="group block"
                >
                  <p className="text-eyebrow text-ink-muted">Previously</p>
                  <p className="mt-3 font-serif text-title text-ink transition-colors duration-300 group-hover:text-olive">
                    ← {previous.title}
                  </p>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/journal/${next.slug}`}
                  className="group block md:text-right"
                >
                  <p className="text-eyebrow text-ink-muted">Next</p>
                  <p className="mt-3 font-serif text-title text-ink transition-colors duration-300 group-hover:text-olive">
                    {next.title} →
                  </p>
                </Link>
              ) : (
                <span />
              )}
            </div>

            <p className="mt-12 text-caption text-ink-muted">
              <Link
                href="/journal"
                className="underline underline-offset-4 decoration-bronze/50 hover:text-olive hover:decoration-olive"
              >
                All entries
              </Link>
            </p>
          </Container>
        </section>
      </article>

      <ConciergeClose />

      {ld ? (
        <Script
          id="journal-article-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ) : null}
    </>
  )
}
