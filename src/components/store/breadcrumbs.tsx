import Link from 'next/link'
import Script from 'next/script'

export interface BreadcrumbItem {
  label: string
  href?: string
}

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
        item: baseUrl ? `${baseUrl}${i.href}` : i.href,
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
