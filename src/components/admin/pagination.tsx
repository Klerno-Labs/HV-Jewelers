import Link from 'next/link'
import { cn } from '@/lib/cn'

/**
 * URL-driven pagination. Preserves existing searchParams; flips only the
 * `page` param. Shows a short page strip (current ± 2, with ellipses).
 */

export interface PaginationProps {
  basePath: string
  searchParams: Record<string, string | string[] | undefined>
  currentPage: number
  totalPages: number
  className?: string
}

function buildHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === 'page') continue
    if (Array.isArray(v)) {
      for (const item of v) if (item) params.append(k, item)
    } else if (v) {
      params.set(k, v)
    }
  }
  if (page !== 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

function range(a: number, b: number): number[] {
  const out: number[] = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
}

export function Pagination({
  basePath,
  searchParams,
  currentPage,
  totalPages,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const windowStart = Math.max(2, currentPage - 2)
  const windowEnd = Math.min(totalPages - 1, currentPage + 2)
  const pages: (number | 'gap')[] = [1]
  if (windowStart > 2) pages.push('gap')
  pages.push(...range(windowStart, windowEnd))
  if (windowEnd < totalPages - 1) pages.push('gap')
  if (totalPages > 1) pages.push(totalPages)

  const prev = currentPage > 1 ? currentPage - 1 : null
  const next = currentPage < totalPages ? currentPage + 1 : null

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'mt-8 flex items-center justify-between gap-4 border-t border-limestone-deep/40 pt-6 text-caption',
        className,
      )}
    >
      <div className="text-ink-muted">
        Page <span className="tabular-nums text-ink">{currentPage}</span> of{' '}
        <span className="tabular-nums text-ink">{totalPages}</span>
      </div>
      <ul className="flex items-center gap-1">
        <li>
          {prev ? (
            <Link
              href={buildHref(basePath, searchParams, prev)}
              rel="prev"
              className="px-3 py-1 text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
            >
              ← Prev
            </Link>
          ) : (
            <span className="px-3 py-1 text-ink-muted/60">← Prev</span>
          )}
        </li>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className="px-2 text-ink-muted">
              …
            </li>
          ) : (
            <li key={p}>
              {p === currentPage ? (
                <span className="inline-flex min-w-[28px] justify-center bg-ink px-2 py-1 tabular-nums text-parchment">
                  {p}
                </span>
              ) : (
                <Link
                  href={buildHref(basePath, searchParams, p)}
                  className="inline-flex min-w-[28px] justify-center px-2 py-1 tabular-nums text-ink-soft transition-colors hover:text-olive"
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {next ? (
            <Link
              href={buildHref(basePath, searchParams, next)}
              rel="next"
              className="px-3 py-1 text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive hover:decoration-olive"
            >
              Next →
            </Link>
          ) : (
            <span className="px-3 py-1 text-ink-muted/60">Next →</span>
          )}
        </li>
      </ul>
    </nav>
  )
}
