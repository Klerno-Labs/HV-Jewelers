import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Color',
  robots: { index: false, follow: false },
}

/**
 * Static class map so Tailwind's scanner statically detects each `bg-*`
 * class. Do not compose these from template strings.
 */
const swatches: Record<string, { hex: string; bg: string; ringOnLight?: boolean; light?: boolean }> = {
  parchment: { hex: '#f2ebd7', bg: 'bg-parchment', ringOnLight: true, light: true },
  'parchment-warm': { hex: '#efe4c7', bg: 'bg-parchment-warm', ringOnLight: true, light: true },
  'parchment-deep': { hex: '#e8dfc4', bg: 'bg-parchment-deep', ringOnLight: true, light: true },
  limestone: { hex: '#e8e2d1', bg: 'bg-limestone', ringOnLight: true, light: true },
  'limestone-deep': { hex: '#d9d1bc', bg: 'bg-limestone-deep', light: true },

  olive: { hex: '#4d5a31', bg: 'bg-olive' },
  'olive-deep': { hex: '#3a4526', bg: 'bg-olive-deep' },
  'olive-soft': { hex: '#6b7850', bg: 'bg-olive-soft' },

  cedar: { hex: '#5e4026', bg: 'bg-cedar' },
  'cedar-deep': { hex: '#3e2a18', bg: 'bg-cedar-deep' },
  'cedar-soft': { hex: '#7d5b3e', bg: 'bg-cedar-soft' },

  bronze: { hex: '#8b6a3c', bg: 'bg-bronze' },
  'bronze-deep': { hex: '#6d5330', bg: 'bg-bronze-deep' },
  'antique-gold': { hex: '#b08d57', bg: 'bg-antique-gold' },
  'antique-gold-soft': { hex: '#c4a46f', bg: 'bg-antique-gold-soft' },

  ink: { hex: '#1a1a17', bg: 'bg-ink' },
  'ink-soft': { hex: '#3a3a35', bg: 'bg-ink-soft' },
  'ink-muted': { hex: '#6b6a62', bg: 'bg-ink-muted' },
}

const groups = [
  {
    heading: 'Grounds',
    note: 'Page and surface backgrounds. Never pure white.',
    keys: ['parchment', 'parchment-warm', 'parchment-deep', 'limestone', 'limestone-deep'],
  },
  {
    heading: 'Core · Olive',
    note: 'Primary brand tone. Editorial restraint.',
    keys: ['olive', 'olive-deep', 'olive-soft'],
  },
  {
    heading: 'Core · Cedar',
    note: 'Warmer second tone. Pairs with bronze and gold.',
    keys: ['cedar', 'cedar-deep', 'cedar-soft'],
  },
  {
    heading: 'Accent · Metals',
    note: 'Use sparingly, for emphasis and ornament.',
    keys: ['bronze', 'bronze-deep', 'antique-gold', 'antique-gold-soft'],
  },
  {
    heading: 'Ink',
    note: 'Text and hierarchy.',
    keys: ['ink', 'ink-soft', 'ink-muted'],
  },
] as const

export default function ColorsPage() {
  return (
    <Container className="py-20">
      <p className="text-eyebrow text-bronze">Internal · 02 · Color</p>
      <h1 className="mt-8 font-serif text-display text-ink">Palette</h1>
      <p className="mt-6 max-w-2xl text-subtitle leading-relaxed text-ink-soft">
        An earthy luxury palette: quiet grounds, living core tones, and metal
        accents used with intent. No dead whites. No loud black.
      </p>

      <div className="mt-20 space-y-20">
        {groups.map((group) => (
          <section key={group.heading}>
            <div className="mb-8 flex items-baseline justify-between border-b border-limestone-deep/60 pb-4">
              <h2 className="font-serif text-heading text-ink">{group.heading}</h2>
              <p className="max-w-sm text-right text-caption text-ink-muted">
                {group.note}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.keys.map((key) => {
                const s = swatches[key]!
                return <Swatch key={key} name={key} hex={s.hex} bg={s.bg} light={s.light} />
              })}
            </div>
          </section>
        ))}
      </div>
    </Container>
  )
}

function Swatch({
  name,
  hex,
  bg,
  light,
}: {
  name: string
  hex: string
  bg: string
  light?: boolean
}) {
  return (
    <figure className="group">
      <div
        aria-hidden
        className={`${bg} aspect-[5/4] border ${light ? 'border-ink/10' : 'border-ink/20'}`}
      />
      <figcaption className="mt-4 flex items-baseline justify-between gap-3">
        <span className="font-mono text-caption text-ink">{name}</span>
        <span className="text-eyebrow text-ink-muted">{hex}</span>
      </figcaption>
    </figure>
  )
}
