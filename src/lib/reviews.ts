import 'server-only'
import { BUSINESS } from './business'

/**
 * Google reviews for the Houston store, read live from the Places API.
 *
 * Deliberately has no fallback content. If the key is missing or Google
 * errors, this returns null and the section does not render. Shipping
 * placeholder reviews would be fabricating social proof, which is the
 * exact category of problem the Misrepresentation flag is about: an
 * invented rating is worse than no rating.
 *
 * Google ships two separate products here, enabled independently in
 * Cloud Console: "Places API (New)" and the legacy "Places API". Calling
 * one while the other is enabled returns 403, which is easy to mistake
 * for a bad key. So this tries the new endpoint first and falls back to
 * the legacy one, and works whichever is switched on. Prefer enabling
 * the new API: the legacy one is on a deprecation path.
 */

export interface GoogleReview {
  author: string
  authorPhoto: string | null
  rating: number
  text: string
  /** Google's own phrasing, e.g. "a month ago". Never synthesized here. */
  relativeTime: string
}

export interface GoogleReviewData {
  rating: number
  totalReviews: number
  /** Link to the live listing so any claim here is independently checkable. */
  mapsUri: string
  reviews: GoogleReview[]
}

/**
 * Lowest star rating shown as a pull quote.
 *
 * Google returns "most relevant" reviews, which for this listing surfaced
 * two detailed one-star complaints about counter repair work. Half the
 * homepage telling shoppers to go elsewhere is worse than no reviews.
 *
 * The honesty boundary this respects: the aggregate rating and the total
 * count come straight from Google and are displayed unmodified, the
 * quotes are verbatim and unedited, and the section links out to the
 * full listing. Selecting which real quotes to feature while showing the
 * true average is ordinary merchandising. Inventing a rating is not, and
 * this file still refuses to do that anywhere.
 */
const MIN_DISPLAYED_RATING = 4

/** A review with no text or no author is not evidence of anything. */
function usable(r: GoogleReview): boolean {
  return (
    r.text.length > 0 &&
    r.author.length > 0 &&
    r.rating >= MIN_DISPLAYED_RATING
  )
}

// ── Places API (New) ────────────────────────────────────────────────────

interface NewReview {
  rating?: number
  relativePublishTimeDescription?: string
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: { displayName?: string; photoUri?: string }
}

interface NewResponse {
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: NewReview[]
}

async function fetchNew(apiKey: string): Promise<GoogleReviewData | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${BUSINESS.googlePlaceId}`,
    {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
      },
      next: { revalidate: 86400 },
    },
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[reviews] Places API (New) ${res.status}: ${detail.slice(0, 300)}`)
    return null
  }

  const data = (await res.json()) as NewResponse
  return {
    rating: data.rating ?? 0,
    totalReviews: data.userRatingCount ?? 0,
    mapsUri: data.googleMapsUri ?? '',
    reviews: (data.reviews ?? []).map((r) => ({
      author: r.authorAttribution?.displayName ?? '',
      authorPhoto: r.authorAttribution?.photoUri ?? null,
      rating: r.rating ?? 0,
      text: (r.text?.text ?? r.originalText?.text ?? '').trim(),
      relativeTime: r.relativePublishTimeDescription ?? '',
    })),
  }
}

// ── Legacy Places API ───────────────────────────────────────────────────

interface LegacyReview {
  author_name?: string
  profile_photo_url?: string
  rating?: number
  text?: string
  relative_time_description?: string
}

interface LegacyResponse {
  status?: string
  error_message?: string
  result?: {
    rating?: number
    user_ratings_total?: number
    url?: string
    reviews?: LegacyReview[]
  }
}

async function fetchLegacy(apiKey: string): Promise<GoogleReviewData | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(BUSINESS.googlePlaceId)}` +
    `&fields=rating,user_ratings_total,reviews,url&key=${apiKey}`

  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) {
    console.error('[reviews] legacy Places API HTTP', res.status)
    return null
  }

  const data = (await res.json()) as LegacyResponse
  // The legacy endpoint answers 200 with a status field, so a failure
  // here is not visible in the HTTP code.
  if (data.status !== 'OK' || !data.result) {
    console.error(
      `[reviews] legacy Places API status=${data.status}: ${(data.error_message ?? '').slice(0, 300)}`,
    )
    return null
  }

  const r = data.result
  return {
    rating: r.rating ?? 0,
    totalReviews: r.user_ratings_total ?? 0,
    mapsUri: r.url ?? '',
    reviews: (r.reviews ?? []).map((rv) => ({
      author: rv.author_name ?? '',
      authorPhoto: rv.profile_photo_url ?? null,
      rating: rv.rating ?? 0,
      text: (rv.text ?? '').trim(),
      relativeTime: rv.relative_time_description ?? '',
    })),
  }
}

export async function getGoogleReviews(
  limit = 4,
): Promise<GoogleReviewData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  try {
    const data = (await fetchNew(apiKey)) ?? (await fetchLegacy(apiKey))
    if (!data) return null

    const reviews = data.reviews.filter(usable).slice(0, limit)
    if (reviews.length === 0) return null

    return { ...data, reviews }
  } catch (err) {
    console.error('[reviews] fetch failed', err)
    return null
  }
}
