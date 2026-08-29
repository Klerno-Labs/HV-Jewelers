import Link from 'next/link'
import { BUSINESS } from '@/lib/business'

function productInquiryHref(
  kind: 'video' | 'question',
  productTitle: string,
  productUrl: string,
): string {
  const subject =
    kind === 'video'
      ? `Live video request — ${productTitle}`
      : `Question about ${productTitle}`
  const body =
    kind === 'video'
      ? `Hello HV Jewelers,\n\nI would like a live or recorded video of this piece before purchasing:\n${productTitle}\n${productUrl}\n\nMy question or preferred viewing time is:\n`
      : `Hello HV Jewelers,\n\nI have a question about this piece:\n${productTitle}\n${productUrl}\n\nMy question is:\n`

  return `mailto:${BUSINESS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * High-ticket buying assistance beside the purchase controls. Links are
 * product-specific and require no tracking cookies, account, chatbot, or
 * external scheduling system.
 */
export function ProductAssistance({
  productTitle,
  productUrl,
}: {
  productTitle: string
  productUrl: string
}) {
  return (
    <section
      aria-labelledby="product-assistance-heading"
      className="mt-8 border border-limestone-deep/70 bg-limestone/25 p-5"
    >
      <p className="text-eyebrow text-bronze">See it before you decide</p>
      <h2
        id="product-assistance-heading"
        className="mt-3 font-serif text-heading font-light text-ink"
      >
        Talk to the Houston showroom.
      </h2>
      <p className="mt-3 text-caption leading-relaxed text-ink-soft">
        Ask for another angle, a hand-held video, measurements, or a private
        in-store viewing. This piece is held by the family jeweler behind{' '}
        {BUSINESS.showroomName}, serving Houston since {BUSINESS.showroomSince}.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={productInquiryHref('video', productTitle, productUrl)}
          className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-3 text-center text-eyebrow text-parchment transition-colors hover:bg-olive-deep"
        >
          Request a live video
        </a>
        <a
          href={`tel:${BUSINESS.telephone}`}
          className="inline-flex min-h-11 items-center justify-center border border-limestone-deep bg-parchment px-4 py-3 text-center text-eyebrow text-ink transition-colors hover:border-olive hover:text-olive"
        >
          Call {BUSINESS.telephoneDisplay}
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-caption">
        <a
          href={productInquiryHref('question', productTitle, productUrl)}
          className="text-ink underline decoration-bronze/60 underline-offset-4 transition-colors hover:text-olive hover:decoration-olive"
        >
          Email a product question
        </a>
        <Link
          href="/contact"
          className="text-ink underline decoration-bronze/60 underline-offset-4 transition-colors hover:text-olive hover:decoration-olive"
        >
          Showroom details
        </Link>
      </div>

      <p className="mt-4 text-caption leading-relaxed text-ink-muted">
        For the fastest answer, call during showroom hours. Email inquiries are
        reviewed each business day.
      </p>
    </section>
  )
}
