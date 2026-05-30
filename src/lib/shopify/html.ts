/**
 * Minimal HTML sanitizer for Shopify `descriptionHtml`. The merchant
 * is the site operator on a single-tenant headless storefront, so the
 * threat model is "an admin pasted careless HTML," not arbitrary XSS.
 * This sanitizer focuses on the realistic risks:
 *
 *  - Duplicate `<h1>` colliding with the page-owned product H1
 *  - `<img>` without alt text
 *  - Inline event handlers (`onerror=`, `onclick=`) and `<script>` /
 *    `<iframe>` tags that would never legitimately appear
 *  - Inline `style` attributes that defeat the design system
 *
 * For a hardened sanitizer use `sanitize-html` or `isomorphic-dompurify`;
 * this regex pass is intentionally small to avoid a dep.
 */
export function sanitizeShopifyHtml(input: string | null | undefined): string {
  if (!input) return ''
  let out = input

  // Strip dangerous container tags entirely (open, contents, close).
  out = out.replace(
    /<(script|iframe|object|embed|noscript|style|link|meta)[^>]*>[\s\S]*?<\/\1>/gi,
    '',
  )
  // Strip dangerous self-closing or stray opens.
  out = out.replace(
    /<(script|iframe|object|embed|noscript|style|link|meta)[^>]*\/?>/gi,
    '',
  )

  // Strip on*= event handlers (single or double quoted, or unquoted).
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')

  // Strip inline style="…".
  out = out.replace(/\sstyle\s*=\s*"[^"]*"/gi, '')
  out = out.replace(/\sstyle\s*=\s*'[^']*'/gi, '')

  // Strip javascript: in href/src.
  out = out.replace(/\s(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, ' $1="#"')
  out = out.replace(/\s(href|src)\s*=\s*'\s*javascript:[^']*'/gi, ' $1="#"')

  // Demote any merchant-typed <h1> to <h2> so the page H1 stays canonical.
  out = out.replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
  out = out.replace(/<\/h1\s*>/gi, '</h2>')

  // Ensure every <img> has an alt attribute (empty if missing).
  out = out.replace(/<img\b([^>]*)>/gi, (match, attrs: string) => {
    if (/\balt\s*=/.test(attrs)) return match
    return `<img${attrs} alt="">`
  })

  return out
}
