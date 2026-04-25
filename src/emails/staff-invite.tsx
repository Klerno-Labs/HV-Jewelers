import { Section, Text, Hr } from '@react-email/components'
import { EmailShell, emailStyles as s } from './_shell'

export interface StaffInviteEmailProps {
  inviteeName?: string | null
  inviterName?: string | null
  inviteUrl: string
  roleLabel: string
  expiresAt: string
}

export default function StaffInviteEmail({
  inviteeName,
  inviterName,
  inviteUrl,
  roleLabel,
  expiresAt,
}: StaffInviteEmailProps) {
  return (
    <EmailShell preview={`You've been invited to the HV Jewelers team.`}>
      <Section>
        <Text style={s.eyebrow}>Staff invite · HV Jewelers</Text>
        <Text style={s.h1}>
          {inviteeName ? `Welcome, ${inviteeName}.` : 'Welcome.'}
        </Text>
        <Text style={s.lead}>
          {inviterName ? `${inviterName} added you` : 'You have been added'}{' '}
          to the HV Jewelers team as{' '}
          <strong style={{ color: s.brand.ink }}>{roleLabel}</strong>. Use
          the link below to set your password and sign in.
        </Text>
      </Section>

      <Section style={{ marginTop: '28px' }}>
        <a href={inviteUrl} style={s.button}>
          Set your password
        </a>
      </Section>

      <Hr style={s.hr} />

      <Section>
        <Text style={s.meta}>
          This link expires on{' '}
          <span style={{ color: s.brand.ink }}>{expiresAt}</span>. If the
          button doesn&apos;t work, paste this URL into your browser:
        </Text>
        <Text
          style={{
            ...s.meta,
            fontFamily:
              '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
            fontSize: '12px',
            color: s.brand.ink,
            wordBreak: 'break-all' as const,
          }}
        >
          {inviteUrl}
        </Text>
      </Section>

      <Section style={{ marginTop: '24px' }}>
        <Text style={s.meta}>
          If you weren&apos;t expecting this invitation, ignore this
          email. It won&apos;t grant access unless the password is set.
        </Text>
      </Section>
    </EmailShell>
  )
}
