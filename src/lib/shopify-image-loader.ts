import type { ImageLoader } from 'next/image'

/**
 * Custom next/image loader — resizes through each host's own CDN
 * instead of Vercel's Image Optimization API.
 *
 * Why: Vercel's built-in optimizer (the `/_next/image` route) bills per
 * unique source image transformed. The catalog (221 products and
 * growing) exceeded the Hobby plan's included monthly quota, so
 * new/uncached product photos started coming back `402 Payment
 * Required` (`OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`) instead of
 * rendering — that's the "images not showing up" bug this fixes.
 *
 * Shopify's CDN already supports on-the-fly resizing via a `?width=`
 * query param — the same trick `src/lib/image-bg.ts` uses for its
 * thumbnail sampling — so routing every Shopify-hosted photo through
 * that instead removes Vercel's optimizer, and its billing, from the
 * path entirely.
 *
 * Local `/public` assets (just the wordmark) are returned unchanged:
 * skipping Vercel's optimizer for those too means this class of bug
 * can't recur regardless of plan usage elsewhere.
 */
const shopifyImageLoader: ImageLoader = ({ src, width }) => {
  // Local static assets (e.g. /brand/wordmark.png) — served as-is.
  if (src.startsWith('/')) return src

  try {
    const url = new URL(src)
    if (url.hostname === 'cdn.shopify.com') {
      url.searchParams.set('width', String(width))
      return url.toString()
    }
  } catch {
    // Malformed URL — fall through and hand back the original string.
  }

  // Anything else (e.g. a future Cloudinary URL) — pass through
  // unchanged rather than risk mangling a host we don't know how to
  // resize.
  return src
}

export default shopifyImageLoader
