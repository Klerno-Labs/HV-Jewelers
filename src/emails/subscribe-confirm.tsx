import { Section, Text } from '@react-email/components'
import { EmailShell, emailStyles as s } from './_shell'

/**
 * Welcome email for a new newsletter / pre-launch subscriber. Fired from
 * /api/subscribe on a genuinely-new signup. Pre-launch tone: there is no
 * shop to link to yet, so this just confirms they're on the list.
 */
export default function SubscribeConfirmEmail() {
  return (
    <EmailShell preview="You're on the list — you'll be first to see the collection.">
      <Section>
        <Text style={s.eyebrow}>Welcome</Text>
        <Text style={s.h1}>You&apos;re on the list.</Text>
        <Text style={s.lead}>
          Thank you for joining HV Jewelers. The collection is small and chosen
          by hand — and you&apos;ll be among the first to see it when it opens.
        </Text>
        <Text style={s.lead}>
          We&apos;ll only write when there&apos;s something worth your attention:
          the first pieces, a new arrival, the occasional note from Hoang Vi.
        </Text>
        <Text style={s.meta}>
          Didn&apos;t sign up? You can safely ignore this — there&apos;s nothing
          further to do.
        </Text>
      </Section>
    </EmailShell>
  )
}
