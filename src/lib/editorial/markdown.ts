/**
 * Server-side markdown rendering policy. Centralized so both the journal
 * article page and any future MDX surface share the same allowlist.
 *
 * Defense-in-depth:
 *   1. `remark-rehype` runs with `allowDangerousHtml: false` (its default
 *      from react-markdown), so raw HTML in source is dropped before the
 *      rehype tree exists.
 *   2. `rehype-sanitize` runs the rehype tree against an allowlist of
 *      tags and attributes. Anything outside is removed.
 *   3. Anchor and image schemes are restricted to http(s) and mailto.
 *
 * Output styling lives in `EditorialProse` via the components prop.
 */

import { defaultSchema } from 'rehype-sanitize'

const baseAttrs = defaultSchema.attributes ?? {}

export const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...(defaultSchema.protocols ?? {}),
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
  attributes: {
    ...baseAttrs,
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  // defaultSchema already excludes <script>; this keeps it explicit if the
  // upstream default ever drifts.
  tagNames: (defaultSchema.tagNames ?? []).filter((t) => t !== 'script'),
}
