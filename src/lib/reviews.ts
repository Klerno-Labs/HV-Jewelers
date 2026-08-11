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
 * Uses Places API (New). The legacy `maps.googleapis.com/place/details`
 * endpoint still answers for older projects, but a key created today
 * enables the new one, so that is what this targets.
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

interface PlacesReview {
  rating?: number
  relativePublishTimeDescription?: string
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: { displayName?: string; photoUri?: string }
}

interface PlacesResponse {
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: PlacesReview[]
}

const FIELD_MASK = 'rating,userRatingCount,googleMapsUri,reviews'

export async function getGoogleReviews(
  limit = 4,
): Promise<GoogleReviewData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${BUSINESS.googlePlaceId}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        // Reviews change slowly; a day-long cache keeps quota use trivial.
        next: { revalidate: 86400 },
      },
    )

    if (!res.ok) {
      console.error('[reviews] Places API returned', res.status)
      return null
    }

    const data = (await res.json()) as PlacesResponse

    const reviews: GoogleReview[] = (data.reviews ?? [])
      .map((r) => ({
        author: r.authorAttribution?.displayName ?? '',
        authorPhoto: r.authorAttribution?.photoUri ?? null,
        rating: r.rating ?? 0,
        text: (r.text?.text ?? r.originalText?.text ?? '').trim(),
        relativeTime: r.relativePublishTimeDescription ?? '',
      }))
      // An anonymous or empty review is not evidence of anything; drop it
      // rather than pad the section out to a target count.
      .filter((r) => r.text.length > 0 && r.author.length > 0)
      .slice(0, limit)

    if (reviews.length === 0) return null

    return {
      rating: data.rating ?? 0,
      totalReviews: data.userRatingCount ?? 0,
      mapsUri: data.googleMapsUri ?? '',
      reviews,
    }
  } catch (err) {
    console.error('[reviews] fetch failed', err)
    return null
  }
}
