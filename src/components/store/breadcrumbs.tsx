import Link from 'next/link'
import Script from 'next/script'

export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * Absolute origin for the JSON-LD `item` values.
 *
 * schema.org reads `item` as a node reference, so a bare "/shop" is parsed as
 * an invalid `@id` — which Search Console reports as
 * `Invalid URL in field "id" (in "itemListElement.item")`. No call site passes
 * `baseUrl`, so before this default every breadcrumb on the site emitted
 * relative paths. Fixed origin, never the request host, matching the canonical
 * the middleware emits.
 */
const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hvjewelers.com'
).replace(/\/$/, '')

export function Breadcrumbs({
  items,
  baseUrl = '',
}: {
  items: BreadcrumbItem[]
  baseUrl?: string
}) {
  // BreadcrumbList JSON-LD for collection pages. Only emit items that
  // have hrefs so that crawlers do not see a navigation dead-end.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
      .filter((i) => Boolean(i.href))
      .map((i, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: i.label,
        item: `${(baseUrl || SITE_ORIGIN).replace(/\/$/, '')}${i.href}`,
      })),
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-eyebrow text-ink-muted">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <li key={`${i}-${item.label}`} className="flex items-center gap-2">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="transition-colors duration-200 hover:text-olive"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className="text-ink">
                    {item.label}
                  </span>
                )}
                {!isLast ? <span aria-hidden>·</span> : null}
              </li>
            )
          })}
        </ol>
      </nav>
      <Script
        id="breadcrumb-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  )
}
