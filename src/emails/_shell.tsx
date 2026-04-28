import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

/**
 * Shared layout for every HV Jewelers transactional email. Inline styles
 * — email clients do not understand CSS classes.
 */

const brand = {
  parchment: '#f2ebd7',
  limestone: '#e8e2d1',
  ink: '#1a1a17',
  inkSoft: '#3a3a35',
  inkMuted: '#6b6a62',
  bronze: '#8b6a3c',
  olive: '#4d5a31',
  antiqueGold: '#b08d57',
  // Phase Colors · Greek palette mirrored here so React Email's inline
  // styles can pull the same hexes as the storefront tokens. Email
  // clients ignore CSS variables — this is the canonical translation.
  greekTeal: '#007ba7',
  greekTealDeep: '#005f82',
  sunGold: '#c8a55f',
  terracotta: '#c6934b',
  murexPurple: '#703529',
  templeStone: '#e0ddd5',
}

const serifFamily =
  '"Cormorant Garamond", "Cormorant", "Garamond", Georgia, "Times New Roman", serif'
const sansFamily =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

export function EmailShell({
  preview,
  children,
}: {
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: brand.parchment,
          color: brand.ink,
          fontFamily: sansFamily,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: '48px 32px 56px',
          }}
        >
          <Section style={{ textAlign: 'left' as const, marginBottom: '32px' }}>
            <Text
              style={{
                fontFamily: serifFamily,
                fontSize: '20px',
                letterSpacing: '0.01em',
                color: brand.ink,
                margin: 0,
              }}
            >
              HV Jewelers
            </Text>
            <Text
              style={{
                fontFamily: sansFamily,
                fontSize: '11px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase' as const,
                color: brand.inkMuted,
                margin: '4px 0 0',
              }}
            >
              Hoang Vi Jewelers
            </Text>
          </Section>

          {children}

          <Hr
            style={{
              borderColor: 'rgba(26,26,23,0.15)',
              borderStyle: 'solid',
              borderWidth: '1px 0 0 0',
              margin: '48px 0 24px',
            }}
          />
          <Text
            style={{
              fontFamily: sansFamily,
              fontSize: '12px',
              color: brand.inkMuted,
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            HV Jewelers (Hoang Vi). Real replies from real people. Reach
            us at{' '}
            <a
              href="mailto:concierge@hvjewelers.com"
              style={{
                color: brand.greekTealDeep,
                textDecoration: 'underline',
                textDecorationColor: 'rgba(0,123,167,0.55)',
                textUnderlineOffset: '3px',
              }}
            >
              concierge@hvjewelers.com
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const emailStyles = {
  brand,
  serifFamily,
  sansFamily,
  // Phase Colors: heading reads in sun-gold for the editorial / heritage
  // glow. Eyebrow shifts to terracotta-deep for warm contrast above the
  // heading without competing.
  h1: {
    fontFamily: serifFamily,
    fontSize: '34px',
    fontWeight: 300 as const,
    fontStyle: 'italic' as const,
    lineHeight: '1.15',
    color: brand.sunGold,
    margin: '0 0 20px',
  },
  eyebrow: {
    fontFamily: sansFamily,
    fontSize: '11px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: '#a8783a', // terracotta-deep — direct hex; email clients
    // can't resolve our CSS vars and the brand object isn't typed
    // narrowly enough to require it here.
    margin: '0 0 8px',
  },
  lead: {
    fontFamily: sansFamily,
    fontSize: '15px',
    lineHeight: '1.7',
    color: brand.inkSoft,
    margin: '0 0 16px',
  },
  meta: {
    fontFamily: sansFamily,
    fontSize: '13px',
    lineHeight: '1.6',
    color: brand.inkMuted,
    margin: '0 0 8px',
  },
  sectionTitle: {
    fontFamily: sansFamily,
    fontSize: '11px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: brand.inkMuted,
    margin: '0 0 12px',
  },
  hr: {
    borderColor: 'rgba(26,26,23,0.15)',
    borderStyle: 'solid',
    borderWidth: '1px 0 0 0',
    margin: '28px 0',
  },
  // Email CTA mirrors the storefront primary — terracotta ground,
  // parchment ink. Sun-gold hover doesn't apply (no hover in email).
  button: {
    display: 'inline-block' as const,
    padding: '12px 24px',
    backgroundColor: brand.terracotta,
    color: brand.parchment,
    fontFamily: sansFamily,
    fontSize: '13px',
    letterSpacing: '0.04em',
    textDecoration: 'none',
  },
  orderNumber: {
    fontFamily:
      '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '14px',
    color: brand.ink,
  },
}
