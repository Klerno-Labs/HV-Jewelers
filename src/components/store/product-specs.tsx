import type {
  GoldKarat,
  MaterialKind,
  ProductCondition,
  StoneKind,
} from '@prisma/client'
import {
  CONDITION_LABELS,
  GOLD_KARAT_LABELS,
} from '@/lib/products/eras'

const MATERIAL_LABELS: Record<MaterialKind, string> = {
  GOLD_YELLOW: 'Yellow Gold',
  GOLD_WHITE: 'White Gold',
  GOLD_ROSE: 'Rose Gold',
  GOLD_GREEN: 'Green Gold',
  PLATINUM: 'Platinum',
  STERLING_SILVER: 'Sterling Silver',
  PALLADIUM: 'Palladium',
  STAINLESS_STEEL: 'Stainless Steel',
  TITANIUM: 'Titanium',
  COPPER: 'Copper',
  BRASS: 'Brass',
  OTHER: 'Other',
}

const STONE_LABELS: Record<StoneKind, string> = {
  DIAMOND: 'Diamond',
  SAPPHIRE: 'Sapphire',
  RUBY: 'Ruby',
  EMERALD: 'Emerald',
  JADE: 'Jade',
  PEARL: 'Pearl',
  OPAL: 'Opal',
  TURQUOISE: 'Turquoise',
  AMETHYST: 'Amethyst',
  TOPAZ: 'Topaz',
  CITRINE: 'Citrine',
  GARNET: 'Garnet',
  ONYX: 'Onyx',
  CORAL: 'Coral',
  LAPIS: 'Lapis Lazuli',
  OTHER: 'Other stone',
}

export interface ProductSpecsData {
  goldKarat: GoldKarat
  gramWeight: number | null
  gramWeightVisible: boolean
  ringSize: string | null
  dimensionsText: string | null
  condition: ProductCondition
  conditionNotes: string | null
  signed: boolean
  signedNotes: string | null
  provenance: string | null
  materials: { kind: MaterialKind; notes: string | null }[]
  stones: {
    kind: StoneKind
    caratWeight: number | null
    count: number | null
    notes: string | null
  }[]
}

export function ProductSpecs({ data }: { data: ProductSpecsData }) {
  const showGold = data.goldKarat !== 'NONE'
  const showGram = data.gramWeightVisible && data.gramWeight !== null
  const showRing = Boolean(data.ringSize)
  const showDimensions = Boolean(data.dimensionsText)

  return (
    <div className="grid gap-12 md:grid-cols-2 lg:gap-20">
      {/* ─── Materials column ─── */}
      <section>
        <p className="text-eyebrow text-ink-muted">Materials &amp; stones</p>
        <dl className="mt-6 space-y-6">
          {data.materials.length > 0 ? (
            <Pair
              label="Metal"
              value={
                <ul className="space-y-1.5">
                  {data.materials.map((m, i) => (
                    <li key={i} className="text-body text-ink">
                      {MATERIAL_LABELS[m.kind]}
                      {m.notes ? (
                        <span className="ml-2 text-caption text-ink-muted">
                          · {m.notes}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}

          {data.stones.length > 0 ? (
            <Pair
              label="Stones"
              value={
                <ul className="space-y-1.5">
                  {data.stones.map((s, i) => (
                    <li key={i} className="text-body text-ink">
                      {STONE_LABELS[s.kind]}
                      {(s.count ?? 0) > 1
                        ? ` · ${s.count}`
                        : ''}
                      {s.caratWeight
                        ? ` · ${s.caratWeight} ct`
                        : ''}
                      {s.notes ? (
                        <span className="ml-2 text-caption text-ink-muted">
                          · {s.notes}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}

          {showGold ? (
            <Pair label="Gold purity" value={GOLD_KARAT_LABELS[data.goldKarat]} />
          ) : null}
          {showGram ? (
            <Pair
              label="Gram weight"
              value={`${data.gramWeight!.toString()} g`}
            />
          ) : null}
        </dl>
      </section>

      {/* ─── Piece column ─── */}
      <section>
        <p className="text-eyebrow text-ink-muted">The piece</p>
        <dl className="mt-6 space-y-6">
          {showRing ? <Pair label="Ring size" value={data.ringSize!} /> : null}
          {showDimensions ? (
            <Pair label="Dimensions" value={data.dimensionsText!} />
          ) : null}
          <Pair
            label="Condition"
            value={
              <>
                {CONDITION_LABELS[data.condition]}
                {data.conditionNotes ? (
                  <span className="mt-2 block text-caption leading-relaxed text-ink-muted">
                    {data.conditionNotes}
                  </span>
                ) : null}
              </>
            }
          />
          <Pair
            label="Signature"
            value={
              data.signed ? (
                <>
                  Signed
                  {data.signedNotes ? (
                    <span className="mt-2 block text-caption leading-relaxed text-ink-muted">
                      {data.signedNotes}
                    </span>
                  ) : null}
                </>
              ) : (
                'Unsigned'
              )
            }
          />
          {data.provenance ? (
            <Pair
              label="Provenance"
              value={
                <span className="text-body leading-relaxed text-ink-soft">
                  {data.provenance}
                </span>
              }
            />
          ) : null}
        </dl>
      </section>
    </div>
  )
}

function Pair({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="border-b border-limestone-deep/40 pb-4 last:border-b-0">
      <dt className="text-eyebrow text-ink-muted">{label}</dt>
      <dd className="mt-2 text-body text-ink">{value}</dd>
    </div>
  )
}
