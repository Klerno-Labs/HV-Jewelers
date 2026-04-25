import { Section, Text, Hr } from '@react-email/components'
import { EmailShell, emailStyles as s } from './_shell'

export interface OrderRefundedEmailProps {
  orderNumber: string
  customerName?: string | null
  amountCents: number
  totalRefundedCents: number
  orderTotalCents: number
  currency: string
  reason?: string | null
  note?: string | null
  isFull: boolean
}

function money(cents: number, currency: string) {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100).toLocaleString('en-US')
  const r = abs % 100
  const symbol = currency === 'USD' ? '$' : `${currency} `
  return r === 0 ? `${sign}${symbol}${dollars}` : `${sign}${symbol}${dollars}.${r.toString().padStart(2, '0')}`
}

export default function OrderRefundedEmail({
  orderNumber,
  customerName,
  amountCents,
  totalRefundedCents,
  orderTotalCents,
  currency,
  note,
  isFull,
}: OrderRefundedEmailProps) {
  return (
    <EmailShell preview={`Refund issued on order ${orderNumber}.`}>
      <Section>
        <Text style={s.eyebrow}>
          Order {orderNumber} · {isFull ? 'Refunded' : 'Partial refund'}
        </Text>
        <Text style={s.h1}>
          {isFull ? 'Refund on the way.' : 'Partial refund issued.'}
        </Text>
        <Text style={s.lead}>
          {customerName ? `${customerName}, we have` : 'We have'} issued{' '}
          <strong style={{ color: s.brand.ink }}>
            {money(amountCents, currency)}
          </strong>{' '}
          back to your original payment method. It usually clears within
          a few business days, depending on your bank.
        </Text>
      </Section>

      <Hr style={s.hr} />

      <Section>
        <Text style={s.sectionTitle}>Details</Text>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <Text style={{ ...s.meta, margin: 0 }}>This refund</Text>
          <Text style={{ ...s.meta, margin: 0, color: s.brand.ink }}>
            {money(amountCents, currency)}
          </Text>
        </div>
        {!isFull ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <Text style={{ ...s.meta, margin: 0 }}>Refunded to date</Text>
              <Text style={{ ...s.meta, margin: 0, color: s.brand.ink }}>
                {money(totalRefundedCents, currency)}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <Text style={{ ...s.meta, margin: 0 }}>Order total</Text>
              <Text style={{ ...s.meta, margin: 0, color: s.brand.ink }}>
                {money(orderTotalCents, currency)}
              </Text>
            </div>
          </>
        ) : null}
      </Section>

      {note ? (
        <Section style={{ marginTop: '24px' }}>
          <Text style={s.sectionTitle}>A note from us</Text>
          <Text style={s.meta}>{note}</Text>
        </Section>
      ) : null}

      <Section style={{ marginTop: '28px' }}>
        <Text style={s.meta}>
          If anything about this doesn&apos;t match your expectation, reply
          here and we will make it right.
        </Text>
      </Section>
    </EmailShell>
  )
}
