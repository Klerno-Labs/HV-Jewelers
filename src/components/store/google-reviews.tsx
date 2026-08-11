import { Container } from '@/components/layout/container'
import { FadeIn } from '@/components/store/fade-in'
import { BUSINESS } from '@/lib/business'
import { getGoogleReviews } from '@/lib/reviews'

/**
 * Google reviews for the Houston store.
 *
 * Attribution is explicit: these are reviews of Premier Jewelers, the
 * shop this collection comes out of. Presenting them as reviews of
 * "HV Jewelers" without saying so would be its own misrepresentation,
 * which defeats the point of adding them.
 *
 * Renders nothing when the Places API is unconfigured or errors. There
 * is no placeholder state on purpose.
 *
 * No aggregateRating structured data anywhere in here: Google disallows
 * self-serving review markup on LocalBusiness, so the rating is shown to
 * people and left out of the schema.
 */
export async function GoogleReviews() {
  const data = await getGoogleReviews(4)
  if (!data) return null

  return (
    <section className="border-t border-limestone-deep/60 bg-limestone/30">
      <Container className="py-20 md:py-28">
        <FadeIn>
          <p className="text-eyebrow text-bronze">In our customers&apos; words</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <h2 className="font-serif text-title font-light italic text-ink">
              {data.rating.toFixed(1)} out of 5
            </h2>
            <p className="text-caption text-ink-soft">
              from {data.totalReviews.toLocaleString()} Google reviews of{' '}
              {BUSINESS.reviewsTradingName}, our Houston store
            </p>
          </div>

          <ul className="mt-14 grid gap-10 md:grid-cols-2 lg:gap-14">
            {data.reviews.map((review, i) => (
              <li
                key={`${review.author}-${i}`}
                className="border-t border-limestone-deep/60 pt-6"
              >
                <p
                  className="text-caption text-bronze"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {'★'.repeat(Math.round(review.rating))}
                  <span className="text-limestone-deep">
                    {'★'.repeat(Math.max(0, 5 - Math.round(review.rating)))}
                  </span>
                </p>
                <blockquote className="mt-4 font-serif text-body leading-[1.85] text-ink-soft">
                  {review.text}
                </blockquote>
                <p className="mt-4 text-caption text-ink-muted">
                  {review.author}, {review.relativeTime}
                </p>
              </li>
            ))}
          </ul>

          {data.mapsUri && (
            <a
              href={data.mapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-block text-caption text-ink underline underline-offset-4 decoration-bronze/60 transition-colors hover:text-olive hover:decoration-olive"
            >
              Read every review on Google
            </a>
          )}
        </FadeIn>
      </Container>
    </section>
  )
}
