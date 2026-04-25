import { Section, Text, Hr } from '@react-email/components'
import { EmailShell, emailStyles as s } from './_shell'

export interface OrderShippedEmailProps {
  orderNumber: string
  customerName?: string | null
  carrier: string
  trackingNumber: string
  trackingUrl?: string | null
  signatureRequired: boolean
}

export default function OrderShippedEmail({
  orderNumber,
  customerName,
  carrier,
  trackingNumber,
  trackingUrl,
  signatureRequired,
}: OrderShippedEmailProps) {
  return (
    <EmailShell preview={`Order ${orderNumber} shipped.`}>
      <Section>
        <Text style={s.eyebrow}>Order {orderNumber} · Shipped</Text>
        <Text style={s.h1}>Your order is on the way.</Text>
        <Text style={s.lead}>
          {customerName ? `${customerName}, your` : 'Your'} order is
          packed and on a {carrier} truck. Tracking number is below.
        </Text>
      </Section>

      <Hr style={s.hr} />

      <Section>
        <Text style={s.sectionTitle}>Tracking</Text>
        <Text
          style={{
            ...s.meta,
            fontSize: '14px',
            color: s.brand.ink,
          }}
        >
          {carrier} · <span style={s.orderNumber}>{trackingNumber}</span>
        </Text>
        {trackingUrl ? (
          <Text style={{ marginTop: '12px' }}>
            <a
              href={trackingUrl}
              style={{
                ...s.meta,
                color: s.brand.ink,
                textDecoration: 'underline',
                textDecorationColor: 'rgba(139,106,60,0.6)',
                textUnderlineOffset: '3px',
                fontSize: '14px',
              }}
            >
              Track this package →
            </a>
          </Text>
        ) : null}
      </Section>

      {signatureRequired ? (
        <Section style={{ marginTop: '28px' }}>
          <Text style={s.sectionTitle}>Signature required</Text>
          <Text style={s.meta}>
            The carrier won&apos;t release the package without a
            signature. Plan to be home for delivery, or use the
            carrier&apos;s site to redirect to a safe hold location.
          </Text>
        </Section>
      ) : null}

      <Section style={{ marginTop: '28px' }}>
        <Text style={s.meta}>
          Reply here with any questions and we&apos;ll get back to you.
        </Text>
      </Section>
    </EmailShell>
  )
}
