import { unstable_cache } from 'next/cache'
import sharp from 'sharp'

/**
 * Samples a product photo so image tiles can present consistently:
 *
 * - `bg` — the photo's background color (average of the four corner
 *   patches; studio shots keep the piece centered, so corners are
 *   reliably background). Tiles painted with it blend seamlessly with
 *   the letterboxed photo. The catalog mixes cool-white and warm-cream
 *   shots, so no single tile color works.
 * - `box` — normalized bounding box of the subject (everything that
 *   isn't background). Cards use it to zoom each photo so the piece
 *   presents at a consistent size — the raw photos range from tight
 *   crops that fill the frame to wide pillow shots where the piece is
 *   a fraction of the frame.
 *
 * Fetches a small thumbnail via Shopify's CDN resizer. Cached per image
 * URL; Shopify busts the `?v=` param when a file changes, so entries
 * never go stale.
 */

export interface ImageTileData {
  bg: string
  /** Subject bounds, normalized 0..1 relative to the image. */
  box: { x: number; y: number; w: number; h: number } | null
}

const SAMPLE_WIDTH = 96
const CORNER_PATCH = 6
// Channel distance from the background color beyond which a pixel counts
// as subject. Loose enough to skip vignettes, tight enough to catch the
// prop (pillow/stand) and its shadow, which is what tiles normalize on.
const SUBJECT_THRESHOLD = 24

async function sampleImageTile(url: string): Promise<ImageTileData> {
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
  const bgR = r / n
  const bgG = g / n
  const bgB = b / n

  // Subject bounds: pixels that differ noticeably from the background.
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const dist = Math.max(
        Math.abs((data[i] ?? 0) - bgR),
        Math.abs((data[i + 1] ?? 0) - bgG),
        Math.abs((data[i + 2] ?? 0) - bgB),
      )
      if (dist > SUBJECT_THRESHOLD) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  const box =
    maxX >= minX && maxY >= minY
      ? {
          x: minX / width,
          y: minY / height,
          w: (maxX - minX + 1) / width,
          h: (maxY - minY + 1) / height,
        }
      : null

  return {
    bg: `rgb(${Math.round(bgR)} ${Math.round(bgG)} ${Math.round(bgB)})`,
    box,
  }
}

// Errors are thrown (not returned) so unstable_cache never caches a
// failure — a transient fetch timeout retries on the next render instead
// of pinning a limestone fallback until the next deploy.
const cachedSample = unstable_cache(sampleImageTile, ['image-tile-v1'])

export async function getImageTileData(
  url: string,
): Promise<ImageTileData | null> {
  try {
    return await cachedSample(url)
  } catch {
    // Fail soft — callers fall back to the limestone tile ground.
    return null
  }
}

/** Sample many URLs at once; unresolvable images are simply omitted. */
export async function getImageTiles(
  urls: string[],
): Promise<Record<string, ImageTileData>> {
  const unique = [...new Set(urls)]
  const tiles = await Promise.all(unique.map((u) => getImageTileData(u)))
  const out: Record<string, ImageTileData> = {}
  unique.forEach((u, i) => {
    const t = tiles[i]
    if (t) out[u] = t
  })
  return out
}

/** Background colors only — for surfaces that don't normalize zoom. */
export async function getImageBgColors(
  urls: string[],
): Promise<Record<string, string>> {
  const tiles = await getImageTiles(urls)
  const out: Record<string, string> = {}
  for (const [u, t] of Object.entries(tiles)) out[u] = t.bg
  return out
}
