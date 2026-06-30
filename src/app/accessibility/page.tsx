import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Accessibility',
  description:
    'Our commitment to an accessible HV Jewelers experience, and how to reach us if anything gets in your way.',
}

export default function AccessibilityPage() {
  return (
    <Container className="py-20 md:py-28" width="reading">
      <p className="text-eyebrow text-bronze">Accessibility</p>
      <h1 className="mt-6 font-serif text-display-lg text-ink">
        Everyone should be able to look.
      </h1>

      <div className="hv-gold-rule my-12 w-16" />

      <p className="text-subtitle leading-relaxed text-ink-soft">
        We want HV Jewelers to be usable by everyone, however you browse. We
        aim to meet WCAG 2.1 AA: keyboard navigation, visible focus, sufficient
        contrast, descriptive labels, and text that scales.
      </p>

      <p className="mt-6 leading-relaxed text-ink-soft">
        Accessibility is ongoing work, not a finish line. If any part of the
        site gets in your way, a page you can&apos;t navigate, an image without
        a description, anything at all, please tell us and we&apos;ll fix it.
      </p>

      <p className="mt-6 leading-relaxed text-ink-soft">
        Reach us at{' '}
        <Link
          href="mailto:concierge@hvjewelers.com"
          className="text-olive underline-offset-4 transition-colors hover:underline"
        >
          concierge@hvjewelers.com
        </Link>{' '}
        and we&apos;ll respond promptly.
      </p>
    </Container>
  )
}
