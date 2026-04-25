import {
  Checkbox,
  FormField,
  Select,
  Textarea,
  TextInput,
} from '@/components/admin/form-fields'

const KIND_OPTIONS = [
  { value: 'ARCHIVE_VINTAGE', label: 'Vintage Era · Archive' },
  { value: 'NEAR_VINTAGE', label: 'Near Vintage' },
  { value: 'FINE_JEWELRY', label: 'Modern Fine Jewelry' },
  { value: 'JADE', label: 'Jade' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'PEARLS', label: 'Pearls' },
  { value: 'NEW_ARRIVALS', label: 'New Arrivals' },
  { value: 'CURATED', label: 'Curated edit' },
]

export interface CollectionFormDefaults {
  slug?: string
  title?: string
  kind?: string
  description?: string | null
  heroImagePublicId?: string | null
  heroImageUrl?: string | null
  position?: number
  isPublished?: boolean
  isFeatured?: boolean
  metaTitle?: string | null
  metaDescription?: string | null
}

export function CollectionFormFields({
  defaults,
}: {
  defaults: CollectionFormDefaults
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <FormField id="title" label="Title">
        <TextInput
          id="title"
          name="title"
          defaultValue={defaults.title}
          required
          maxLength={140}
        />
      </FormField>
      <FormField
        id="slug"
        label="Slug"
        hint="Lowercase letters, digits, and hyphens. Used as the public URL."
      >
        <TextInput
          id="slug"
          name="slug"
          defaultValue={defaults.slug}
          required
          maxLength={140}
        />
      </FormField>
      <FormField id="kind" label="Kind">
        <Select
          id="kind"
          name="kind"
          defaultValue={defaults.kind ?? 'CURATED'}
          options={KIND_OPTIONS}
        />
      </FormField>
      <FormField id="position" label="Position" hint="Lower numbers surface first.">
        <TextInput
          id="position"
          name="position"
          type="number"
          defaultValue={defaults.position ?? 0}
        />
      </FormField>
      <FormField
        id="heroImagePublicId"
        label="Cloudinary public_id (hero)"
        className="lg:col-span-2"
      >
        <TextInput
          id="heroImagePublicId"
          name="heroImagePublicId"
          defaultValue={defaults.heroImagePublicId ?? ''}
          maxLength={256}
        />
      </FormField>
      <FormField
        id="heroImageUrl"
        label="Hero image URL"
        className="lg:col-span-2"
      >
        <TextInput
          id="heroImageUrl"
          name="heroImageUrl"
          type="url"
          defaultValue={defaults.heroImageUrl ?? ''}
          maxLength={2048}
        />
      </FormField>
      <FormField id="description" label="Description" className="lg:col-span-2">
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description ?? ''}
          rows={4}
          maxLength={2000}
        />
      </FormField>
      <FormField id="metaTitle" label="Meta title (SEO)">
        <TextInput
          id="metaTitle"
          name="metaTitle"
          defaultValue={defaults.metaTitle ?? ''}
          maxLength={280}
        />
      </FormField>
      <FormField id="metaDescription" label="Meta description (SEO)">
        <TextInput
          id="metaDescription"
          name="metaDescription"
          defaultValue={defaults.metaDescription ?? ''}
          maxLength={280}
        />
      </FormField>
      <div className="lg:col-span-2">
        <div className="space-y-4">
          <Checkbox
            id="isPublished"
            name="isPublished"
            label="Published"
            hint="Only published collections appear in the storefront nav."
            defaultChecked={defaults.isPublished ?? false}
          />
          <Checkbox
            id="isFeatured"
            name="isFeatured"
            label="Featured"
            hint="Flag for promotion across homepage and editorial modules."
            defaultChecked={defaults.isFeatured ?? false}
          />
        </div>
      </div>
    </div>
  )
}
