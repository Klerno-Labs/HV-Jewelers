import { Section, Text, Hr } from '@react-email/components'
import { EmailShell, emailStyles as s } from './_shell'

export interface OrderConfirmationEmailProps {
  orderNumber: string
  customerName?: string | null
  lines: Array<{
    title: string
    era: string
    quantity: number
    totalCents: number
  }>
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  currency: string
  shipTo: {
    name: string
    line1: string
    line2?: string | null
    city: string
    region: string
    postalCode: string
    country: string
  } | null
  orderUrl: string
  signatureRequired: boolean
}

function money(cents: number, currency: string) {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100).toLocaleString('en-US')
  const r = abs % 100
  const symbol = currency === 'USD' ? '$' : `${currency} `
  return r === 0 ? `${sign}${symbol}${dollars}` : `${sign}${symbol}${dollars}.${r.toString().padStart(2, '0')}`
}

export default function OrderConfirmationEmail({
  orderNumber,
  customerName,
  lines,
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
  currency,
  shipTo,
  orderUrl,
  signatureRequired,
}: OrderConfirmationEmailProps) {
  return (
    <EmailShell preview={`Order ${orderNumber} confirmed.`}>
      <Section>
        <Text style={s.eyebrow}>Order {orderNumber} · Confirmed</Text>
        <Text style={s.h1}>Thanks for your order.</Text>
        <Text style={s.lead}>
          {customerName ? `${customerName}, we` : 'We'} have your order
          and are getting it ready to ship. We&apos;ll send another note
          with tracking once it&apos;s on its way.
        </Text>
      </Section>

      <Hr style={s.hr} />

      <Section>
        <Text style={s.sectionTitle}>Pieces</Text>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '10px 0',
              borderBottom: '1px solid rgba(26,26,23,0.08)',
            }}
          >
            <div>
              <Text
                style={{
                  ...s.meta,
                  color: s.brand.inkMuted,
                  margin: 0,
                  fontSize: '11px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase' as const,
                }}
              >
                {line.era.replace('_', ' ')}
              </Text>
              <Text
                style={{
                  fontFamily: s.serifFamily,
                  fontSize: '18px',
                  color: s.brand.ink,
                  margin: '4px 0 0',
                }}
              >
                {line.title}
              </Text>
              <Text style={{ ...s.meta, margin: '4px 0 0' }}>
                Qty {line.quantity}
              </Text>
            </div>
            <Text
              style={{
                fontFamily: s.sansFamily,
                fontSize: '14px',
                color: s.brand.ink,
                margin: 0,
                whiteSpace: 'nowrap' as const,
              }}
            >
              {money(line.totalCents, currency)}
            </Text>
          </div>
        ))}
      </Section>

      <Section style={{ marginTop: '24px' }}>
        <Text style={s.sectionTitle}>Totals</Text>
        <TotalRow label="Subtotal" value={money(subtotalCents, currency)} />
        <TotalRow label="Shipping" value={money(shippingCents, currency)} />
        {taxCents > 0 ? (
          <TotalRow label="Tax" value={money(taxCents, currency)} />
        ) : null}
        <div
          style={{
            borderTop: '1px solid rgba(26,26,23,0.15)',
            marginTop: '10px',
            paddingTop: '10px',
          }}
        >
          <TotalRow label="Total" value={money(totalCents, currency)} strong />
        </div>
      </Section>

      {shipTo ? (
        <Section style={{ marginTop: '28px' }}>
          <Text style={s.sectionTitle}>Shipping to</Text>
          <Text style={{ ...s.meta, color: s.brand.ink, fontSize: '14px' }}>
            {shipTo.name}
            <br />
            {shipTo.line1}
            {shipTo.line2 ? (
              <>
                <br />
                {shipTo.line2}
              </>
            ) : null}
            <br />
            {shipTo.city}, {shipTo.region} {shipTo.postalCode}
            <br />
            {shipTo.country}
          </Text>
          {signatureRequired ? (
            <Text style={{ ...s.meta, marginTop: '8px' }}>
              Signature required on delivery.
            </Text>
          ) : null}
        </Section>
      ) : null}

      <Section style={{ marginTop: '32px' }}>
        <a href={orderUrl} style={s.button}>
          View order details
        </a>
      </Section>

      <Section style={{ marginTop: '28px' }}>
        <Text style={s.meta}>
          Questions? Just reply to this email and we&apos;ll get back to
          you.
        </Text>
      </Section>
    </EmailShell>
  )
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
      }}
    >
      <Text
        style={{
          ...s.meta,
          color: strong ? s.brand.ink : s.brand.inkSoft,
          fontSize: strong ? '15px' : '13px',
          margin: 0,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          ...s.meta,
          color: strong ? s.brand.ink : s.brand.inkSoft,
          fontSize: strong ? '15px' : '13px',
          margin: 0,
          whiteSpace: 'nowrap' as const,
        }}
      >
        {value}
      </Text>
    </div>
  )
}
