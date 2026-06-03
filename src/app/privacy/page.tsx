// Privacy policy. Mirrors the /accessibility page structure (Container
// width="reading" + eyebrow + serif headline + gold rule + ink-soft body).
//
// NOTE (Claude, 2026-06-03): content is written to match the ACTUAL stack —
// Shopify-hosted checkout (we never touch card data), Resend for email,
// Vercel hosting, the newsletter Subscriber list, and the Auth.js account
// tables. It is production-shaped but should get a legal review before this
// ships publicly. Fixes the footer's /privacy 404.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How HV Jewelers collects, uses, and protects your information — written plainly.',
}

export default function PrivacyPage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Privacy</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        Your information, handled with care.
      </h1>

      <div className="hv-gold-rule my-12 w-16" />

      <p className="text-subtitle leading-relaxed text-ink-soft">
        This explains what we collect when you visit HV Jewelers, why, and the
        choices you have. We keep it short and specific — no boilerplate we
        don&apos;t mean.
      </p>

      <h2 className="mt-14 font-serif text-subtitle text-ink">What we collect</h2>
      <ul className="mt-4 space-y-3 leading-relaxed text-ink-soft">
        <li>
          <strong className="text-ink">Email address</strong> — when you join
          our list to hear when the collection opens. You can unsubscribe at any
          time from any email we send.
        </li>
        <li>
          <strong className="text-ink">Account details</strong> — if you create
          an account, your name and email so you can sign in and see your
          history.
        </li>
        <li>
          <strong className="text-ink">Order &amp; payment information</strong>{' '}
          — checkout is handled securely by Shopify. Your payment is processed by
          Shopify and its payment providers; we never see or store your full card
          number.
        </li>
        <li>
          <strong className="text-ink">Technical data</strong> — IP address,
          browser type, and basic security logs, used to keep the site working
          and protected.
        </li>
      </ul>

      <h2 className="mt-12 font-serif text-subtitle text-ink">How we use it</h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        To fulfill and support your orders, to send updates you&apos;ve asked for,
        to answer your messages, and to keep the site secure. We do not sell your
        personal information.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">
        Who we work with
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        We rely on a small set of trusted services, each only with the data they
        need: <strong className="text-ink">Shopify</strong> (storefront checkout,
        payments, and order processing), <strong className="text-ink">Resend</strong>{' '}
        (sending email), and <strong className="text-ink">Vercel</strong> (hosting
        the site). Each maintains its own privacy and security practices.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">Cookies</h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        We use the cookies needed for the site and checkout to function and to
        keep you signed in. Shopify may set cookies as part of the checkout it
        provides. You can control cookies in your browser settings.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">Your choices</h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        You can unsubscribe from emails, ask us what we hold about you, or ask us
        to correct or delete it. Just reach out and we&apos;ll take care of it.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">Keeping it</h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        We keep information only as long as we need it for the purpose it was
        given — to run your account, support an order, or honor a subscription —
        and then we remove it.
      </p>

      <h2 className="mt-12 font-serif text-subtitle text-ink">Changes</h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        If this policy changes in a meaningful way, we&apos;ll update this page.
      </p>

      <p className="mt-12 leading-relaxed text-ink-soft">
        Questions about your privacy? Reach us at{' '}
        <Link
          href="mailto:concierge@hvjewelers.com"
          className="text-olive underline-offset-4 transition-colors hover:underline"
        >
          concierge@hvjewelers.com
        </Link>
        .
      </p>
    </Container>
  )
}
