import { unstable_cache } from 'next/cache'
import sharp from 'sharp'

/**
 * Samples a product photo's background color so image tiles can be painted
 * with the photo's own tone — the catalog mixes cool-white and warm-cream
 * studio shots, so no single tile color matches all of them.
 *
 * Fetches a 32px thumbnail via Shopify's CDN resizer and averages the four
 * corner patches (studio shots keep the piece centered, so corners are
 * reliably background). Cached per image URL; Shopify busts the `?v=`
 * param when a file changes, so entries never go stale.
 */

const SAMPLE_WIDTH = 32
const CORNER_PATCH = 3

async function sampleImageBg(url: string): Promise<string> {
  const thumb = new URL(url)
  thumb.searchParams.set('width', String(SAMPLE_WIDTH))
  const res = await fetch(thumb.toString(), {
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) throw new Error(`thumb fetch ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())

  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const patch = Math.min(CORNER_PATCH, width, height)

  let r = 0
  let g = 0
  let b = 0
  let n = 0
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ]
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x++) {
        const i = (y * width + x) * channels
        r += data[i] ?? 0
        g += data[i + 1] ?? 0
        b += data[i + 2] ?? 0
        n++
      }
    }
  }
  if (n === 0) throw new Error('empty sample')
  return `rgb(${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(b / n)})`
}

// Errors are thrown (not returned) so unstable_cache never caches a
// failure — a transient fetch timeout retries on the next render instead
// of pinning a limestone fallback until the next deploy.
const cachedSample = unstable_cache(sampleImageBg, ['image-bg-v1'])

export async function getImageBgColor(url: string): Promise<string | null> {
  try {
    return await cachedSample(url)
  } catch {
    // Fail soft — callers fall back to the limestone tile ground.
    return null
  }
}

/** Sample many URLs at once; unresolvable images are simply omitted. */
export async function getImageBgColors(
  urls: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(urls)]
  const colors = await Promise.all(unique.map((u) => getImageBgColor(u)))
  const out: Record<string, string> = {}
  unique.forEach((u, i) => {
    const c = colors[i]
    if (c) out[u] = c
  })
  return out
}
