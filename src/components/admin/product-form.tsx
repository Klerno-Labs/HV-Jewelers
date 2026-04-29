'use client'

import { useState } from 'react'
import {
  Checkbox,
  FormField,
  Select,
  Textarea,
  TextInput,
} from './form-fields'

export interface ProductFormDefaults {
  slug?: string
  title?: string
  shortDescription?: string | null
  longDescription?: string | null
  era?: string
  status?: string
  isHidden?: boolean
  price?: string
  compareAt?: string
  currency?: string
  materialsText?: string | null
  stonesText?: string | null
  dimensionsText?: string | null
  goldKarat?: string
  gramWeight?: number | null
  gramWeightVisible?: boolean
  ringSize?: string | null
  isResizable?: boolean
  resizeNotes?: string | null
  resizeVoidsReturn?: boolean
  stockMode?: string
  isReorderable?: boolean
  isFinalSale?: boolean
  returnWindowDays?: number
  signed?: boolean
  signedNotes?: string | null
  provenance?: string | null
  condition?: string
  conditionNotes?: string | null
  isFeatured?: boolean
  isNewArrival?: boolean
  shippingProfileId?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  collectionIds?: string[]
  materials?: MaterialRow[]
  stones?: StoneRow[]
}

interface MaterialRow {
  kind: string
  notes: string
}

interface StoneRow {
  kind: string
  caratWeight: string
  count: string
  notes: string
}

interface CollectionOption {
  id: string
  title: string
}

const ERA_OPTIONS = [
  { value: 'VINTAGE_ERA', label: 'Vintage Era' },
  { value: 'NEAR_VINTAGE', label: 'Near Vintage' },
  { value: 'MODERN_FINE', label: 'Modern Fine Jewelry' },
]

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'NEW_OLD_STOCK', label: 'Older — never worn' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'VERY_GOOD', label: 'Very Good' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
]

const GOLD_KARAT_OPTIONS = [
  { value: 'NONE', label: '—' },
  { value: 'K8', label: '8K' },
  { value: 'K9', label: '9K' },
  { value: 'K10', label: '10K' },
  { value: 'K14', label: '14K' },
  { value: 'K18', label: '18K' },
  { value: 'K22', label: '22K' },
  { value: 'K24', label: '24K' },
]

const STOCK_MODE_OPTIONS = [
  { value: 'ONE_OF_ONE', label: 'One of one' },
  { value: 'LIMITED_STOCK', label: 'Limited stock' },
  { value: 'MADE_TO_ORDER', label: 'Made to order' },
  { value: 'REORDERABLE', label: 'Reorderable' },
]

const MATERIAL_KIND_OPTIONS = [
  { value: 'GOLD_YELLOW', label: 'Gold (yellow)' },
  { value: 'GOLD_WHITE', label: 'Gold (white)' },
  { value: 'GOLD_ROSE', label: 'Gold (rose)' },
  { value: 'GOLD_GREEN', label: 'Gold (green)' },
  { value: 'PLATINUM', label: 'Platinum' },
  { value: 'STERLING_SILVER', label: 'Sterling silver' },
  { value: 'PALLADIUM', label: 'Palladium' },
  { value: 'STAINLESS_STEEL', label: 'Stainless steel' },
  { value: 'TITANIUM', label: 'Titanium' },
  { value: 'COPPER', label: 'Copper' },
  { value: 'BRASS', label: 'Brass' },
  { value: 'OTHER', label: 'Other' },
]

const STONE_KIND_OPTIONS = [
  { value: 'DIAMOND', label: 'Diamond' },
  { value: 'SAPPHIRE', label: 'Sapphire' },
  { value: 'RUBY', label: 'Ruby' },
  { value: 'EMERALD', label: 'Emerald' },
  { value: 'PEARL', label: 'Pearl' },
  { value: 'OPAL', label: 'Opal' },
  { value: 'TURQUOISE', label: 'Turquoise' },
  { value: 'AMETHYST', label: 'Amethyst' },
  { value: 'TOPAZ', label: 'Topaz' },
  { value: 'CITRINE', label: 'Citrine' },
  { value: 'GARNET', label: 'Garnet' },
  { value: 'ONYX', label: 'Onyx' },
  { value: 'CORAL', label: 'Coral' },
  { value: 'LAPIS', label: 'Lapis' },
  { value: 'OTHER', label: 'Other' },
]

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ProductFormFields({
  defaults = {},
  collections = [],
}: {
  defaults?: ProductFormDefaults
  collections?: CollectionOption[]
}) {
  const [slug, setSlug] = useState(defaults.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!defaults.slug)
  const [materials, setMaterials] = useState<MaterialRow[]>(
    defaults.materials ?? [],
  )
  const [stones, setStones] = useState<StoneRow[]>(defaults.stones ?? [])

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManual) setSlug(slugify(e.target.value))
  }

  function addMaterial() {
    setMaterials((prev) => [...prev, { kind: 'GOLD_YELLOW', notes: '' }])
  }
  function removeMaterial(i: number) {
    setMaterials((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateMaterial(i: number, field: keyof MaterialRow, val: string) {
    setMaterials((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)),
    )
  }

  function addStone() {
    setStones((prev) => [...prev, { kind: 'DIAMOND', caratWeight: '', count: '', notes: '' }])
  }
  function removeStone(i: number) {
    setStones((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateStone(i: number, field: keyof StoneRow, val: string) {
    setStones((prev) =>
      prev.map((st, idx) => (idx === i ? { ...st, [field]: val } : st)),
    )
  }

  const inputBase =
    'block h-10 w-full border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink placeholder:text-ink-muted/60 focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze'

  return (
    <>
      {/* Hidden JSON for dynamic arrays */}
      <input type="hidden" name="materialsJson" value={JSON.stringify(materials)} />
      <input type="hidden" name="stonesJson" value={JSON.stringify(stones)} />

      {/* ── Core ── */}
      <fieldset className="space-y-6">
        <legend className="text-eyebrow text-bronze">Core</legend>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <FormField id="title" label="Title" className="lg:col-span-2">
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={140}
              defaultValue={defaults.title}
              onChange={handleTitleChange}
              className={inputBase}
            />
          </FormField>

          <FormField id="slug" label="Slug" hint="Lowercase, hyphens only. Auto-generated from title.">
            <input
              id="slug"
              name="slug"
              type="text"
              required
              maxLength={140}
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
              className={inputBase}
            />
          </FormField>

          <FormField id="era" label="Era">
            <Select id="era" name="era" defaultValue={defaults.era ?? 'VINTAGE_ERA'} options={ERA_OPTIONS} />
          </FormField>

          <FormField id="status" label="Status">
            <Select id="status" name="status" defaultValue={defaults.status ?? 'DRAFT'} options={STATUS_OPTIONS} />
          </FormField>

          <FormField id="condition" label="Condition">
            <Select id="condition" name="condition" defaultValue={defaults.condition ?? 'NEW_OLD_STOCK'} options={CONDITION_OPTIONS} />
          </FormField>

          <FormField id="shortDescription" label="Short description" hint="One-sentence customer-facing standfirst." className="lg:col-span-2">
            <TextInput id="shortDescription" name="shortDescription" defaultValue={defaults.shortDescription ?? ''} maxLength={280} />
          </FormField>

          <FormField id="longDescription" label="Long description (Markdown)" className="lg:col-span-2">
            <Textarea id="longDescription" name="longDescription" defaultValue={defaults.longDescription ?? ''} rows={8} maxLength={2000} />
          </FormField>

          <FormField id="conditionNotes" label="Condition notes" className="lg:col-span-2">
            <Textarea id="conditionNotes" name="conditionNotes" defaultValue={defaults.conditionNotes ?? ''} rows={3} maxLength={2000} />
          </FormField>

          <FormField id="provenance" label="Provenance notes" className="lg:col-span-2">
            <Textarea id="provenance" name="provenance" defaultValue={defaults.provenance ?? ''} rows={3} maxLength={2000} />
          </FormField>

          <div>
            <Checkbox id="signed" name="signed" label="Signed piece" hint="Maker or designer mark present." defaultChecked={defaults.signed ?? false} />
          </div>

          <FormField id="signedNotes" label="Signature notes">
            <TextInput id="signedNotes" name="signedNotes" defaultValue={defaults.signedNotes ?? ''} maxLength={280} />
          </FormField>
        </div>
      </fieldset>

      {/* ── Pricing ── */}
      <fieldset className="mt-10 space-y-6">
        <legend className="text-eyebrow text-bronze">Pricing</legend>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <FormField id="price" label="Price (USD)" hint="Enter in dollars, e.g. 395.00">
            <TextInput id="price" name="price" type="number" defaultValue={defaults.price} placeholder="0.00" required />
          </FormField>

          <FormField id="compareAt" label="Compare-at price (USD)" hint="Must be higher than price if set.">
            <TextInput id="compareAt" name="compareAt" type="number" defaultValue={defaults.compareAt} placeholder="—" />
          </FormField>
        </div>
      </fieldset>

      {/* ── Physical specs ── */}
      <fieldset className="mt-10 space-y-6">
        <legend className="text-eyebrow text-bronze">Physical specs</legend>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <FormField id="goldKarat" label="Gold karat">
            <Select id="goldKarat" name="goldKarat" defaultValue={defaults.goldKarat ?? 'NONE'} options={GOLD_KARAT_OPTIONS} />
          </FormField>

          <FormField id="gramWeight" label="Gram weight">
            <TextInput id="gramWeight" name="gramWeight" type="number" defaultValue={defaults.gramWeight ?? ''} placeholder="—" />
          </FormField>

          <div>
            <Checkbox id="gramWeightVisible" name="gramWeightVisible" label="Show gram weight on product page" defaultChecked={defaults.gramWeightVisible ?? false} />
          </div>

          <FormField id="ringSize" label="Ring size">
            <TextInput id="ringSize" name="ringSize" defaultValue={defaults.ringSize ?? ''} placeholder="e.g. 7 or 7.5" maxLength={16} />
          </FormField>

          <FormField id="dimensionsText" label="Dimensions" hint="Free text, e.g. 18&quot; chain, 6mm band width.">
            <TextInput id="dimensionsText" name="dimensionsText" defaultValue={defaults.dimensionsText ?? ''} maxLength={280} />
          </FormField>

          <FormField id="materialsText" label="Materials (description)" hint="Free-text for customers. Use structured rows below for metadata." className="lg:col-span-2">
            <TextInput id="materialsText" name="materialsText" defaultValue={defaults.materialsText ?? ''} maxLength={280} />
          </FormField>

          <FormField id="stonesText" label="Stones (description)" className="lg:col-span-2">
            <TextInput id="stonesText" name="stonesText" defaultValue={defaults.stonesText ?? ''} maxLength={280} />
          </FormField>
        </div>
      </fieldset>

      {/* ── Return policy ── */}
      <fieldset className="mt-10 space-y-6">
        <legend className="text-eyebrow text-bronze">Return policy</legend>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <FormField id="stockMode" label="Stock mode">
            <Select id="stockMode" name="stockMode" defaultValue={defaults.stockMode ?? 'ONE_OF_ONE'} options={STOCK_MODE_OPTIONS} />
          </FormField>

          <FormField id="returnWindowDays" label="Return window (days)" hint="0 = final sale.">
            <TextInput id="returnWindowDays" name="returnWindowDays" type="number" defaultValue={defaults.returnWindowDays ?? 0} />
          </FormField>

          <div>
            <Checkbox id="isFinalSale" name="isFinalSale" label="Final sale" hint="No returns accepted." defaultChecked={defaults.isFinalSale ?? true} />
          </div>

          <div>
            <Checkbox id="isResizable" name="isResizable" label="Resizable" defaultChecked={defaults.isResizable ?? false} />
          </div>

          <div>
            <Checkbox id="resizeVoidsReturn" name="resizeVoidsReturn" label="Resizing voids return window" defaultChecked={defaults.resizeVoidsReturn ?? true} />
          </div>

          <FormField id="resizeNotes" label="Resize notes">
            <TextInput id="resizeNotes" name="resizeNotes" defaultValue={defaults.resizeNotes ?? ''} maxLength={280} />
          </FormField>

          <div>
            <Checkbox id="isReorderable" name="isReorderable" label="Reorderable" hint="Can be re-stocked indefinitely." defaultChecked={defaults.isReorderable ?? false} />
          </div>
        </div>
      </fieldset>

      {/* ── Catalog flags ── */}
      <fieldset className="mt-10 space-y-4">
        <legend className="text-eyebrow text-bronze">Catalog flags</legend>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Checkbox id="isFeatured" name="isFeatured" label="Featured" hint="Shown first in collection grid." defaultChecked={defaults.isFeatured ?? false} />
          <Checkbox id="isNewArrival" name="isNewArrival" label="New arrival" hint="Appears in the New Arrivals feed." defaultChecked={defaults.isNewArrival ?? false} />
          <Checkbox id="isHidden" name="isHidden" label="Hidden" hint="Excluded from listings; direct link still works." defaultChecked={defaults.isHidden ?? false} />
        </div>
      </fieldset>

      {/* ── Collections ── */}
      {collections.length > 0 && (
        <fieldset className="mt-10">
          <legend className="text-eyebrow text-bronze">Collections</legend>
          <p className="mt-1 text-caption text-ink-muted">Hold ⌘ / Ctrl to select multiple.</p>
          <select
            name="collectionIds"
            multiple
            defaultValue={defaults.collectionIds ?? []}
            size={Math.min(collections.length, 8)}
            className="mt-3 block w-full border border-limestone-deep bg-parchment-warm/40 px-2 py-1 text-body text-ink focus-visible:border-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </fieldset>
      )}

      {/* ── Structured materials ── */}
      <fieldset className="mt-10">
        <div className="flex items-center justify-between">
          <legend className="text-eyebrow text-bronze">Materials (structured)</legend>
          <button
            type="button"
            onClick={addMaterial}
            className="text-caption text-olive underline underline-offset-4 hover:text-olive-deep"
          >
            + Add row
          </button>
        </div>
        {materials.length === 0 && (
          <p className="mt-3 text-caption text-ink-muted">No materials added.</p>
        )}
        <div className="mt-3 space-y-3">
          {materials.map((m, i) => (
            <div key={i} className="flex items-start gap-3">
              <select
                value={m.kind}
                onChange={(e) => updateMaterial(i, 'kind', e.target.value)}
                className="h-10 border border-limestone-deep bg-parchment-warm/40 px-2 text-body text-ink focus-visible:outline-none"
              >
                {MATERIAL_KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={m.notes}
                onChange={(e) => updateMaterial(i, 'notes', e.target.value)}
                placeholder="Notes (optional)"
                maxLength={280}
                className="h-10 flex-1 border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink placeholder:text-ink-muted/60 focus-visible:border-olive focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => removeMaterial(i)}
                aria-label="Remove material"
                className="mt-2 text-caption text-ink-muted hover:text-cedar-deep"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </fieldset>

      {/* ── Structured stones ── */}
      <fieldset className="mt-10">
        <div className="flex items-center justify-between">
          <legend className="text-eyebrow text-bronze">Stones (structured)</legend>
          <button
            type="button"
            onClick={addStone}
            className="text-caption text-olive underline underline-offset-4 hover:text-olive-deep"
          >
            + Add row
          </button>
        </div>
        {stones.length === 0 && (
          <p className="mt-3 text-caption text-ink-muted">No stones added.</p>
        )}
        <div className="mt-3 space-y-3">
          {stones.map((st, i) => (
            <div key={i} className="flex flex-wrap items-start gap-3">
              <select
                value={st.kind}
                onChange={(e) => updateStone(i, 'kind', e.target.value)}
                className="h-10 border border-limestone-deep bg-parchment-warm/40 px-2 text-body text-ink focus-visible:outline-none"
              >
                {STONE_KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="number"
                value={st.caratWeight}
                onChange={(e) => updateStone(i, 'caratWeight', e.target.value)}
                placeholder="ct"
                min="0"
                step="0.001"
                className="h-10 w-20 border border-limestone-deep bg-parchment-warm/40 px-2 text-body text-ink placeholder:text-ink-muted/60 focus-visible:outline-none"
              />
              <input
                type="number"
                value={st.count}
                onChange={(e) => updateStone(i, 'count', e.target.value)}
                placeholder="qty"
                min="0"
                className="h-10 w-16 border border-limestone-deep bg-parchment-warm/40 px-2 text-body text-ink placeholder:text-ink-muted/60 focus-visible:outline-none"
              />
              <input
                type="text"
                value={st.notes}
                onChange={(e) => updateStone(i, 'notes', e.target.value)}
                placeholder="Notes (optional)"
                maxLength={280}
                className="h-10 flex-1 border border-limestone-deep bg-parchment-warm/40 px-3 text-body text-ink placeholder:text-ink-muted/60 focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => removeStone(i)}
                aria-label="Remove stone"
                className="mt-2 text-caption text-ink-muted hover:text-cedar-deep"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </fieldset>

      {/* ── SEO ── */}
      <fieldset className="mt-10 space-y-6">
        <legend className="text-eyebrow text-bronze">SEO</legend>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <FormField id="metaTitle" label="Meta title" hint="Defaults to product title if blank.">
            <TextInput id="metaTitle" name="metaTitle" defaultValue={defaults.metaTitle ?? ''} maxLength={280} />
          </FormField>
          <FormField id="metaDescription" label="Meta description">
            <TextInput id="metaDescription" name="metaDescription" defaultValue={defaults.metaDescription ?? ''} maxLength={280} />
          </FormField>
        </div>
      </fieldset>
    </>
  )
}
