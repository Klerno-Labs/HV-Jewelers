import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'

export default async function AdminShippingPage() {
  await requireStaffOrAdmin()
  const profiles = await prisma.shippingProfile.findMany({
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Shipping"
        description="Insured domestic shipping with signature confirmation. Profiles are seed-managed at launch; full editor arrives in Phase 9."
      />
      <AdminPageBody>
        {profiles.length === 0 ? (
          <p className="text-caption text-ink-muted">
            No shipping profiles yet. Run <code className="font-mono">npm run db:seed</code>{' '}
            to insert the launch defaults.
          </p>
        ) : (
          <ul className="divide-y divide-limestone-deep/40 border border-limestone-deep/60 bg-parchment">
            {profiles.map((p) => (
              <li key={p.id} className="px-6 py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-title text-ink">{p.name}</h3>
                  {p.isDefault ? (
                    <span className="text-eyebrow text-bronze">Default</span>
                  ) : null}
                </div>
                {p.description ? (
                  <p className="mt-2 text-body text-ink-soft">{p.description}</p>
                ) : null}
                <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-caption sm:grid-cols-4">
                  <Pair label="Signature" value={p.signature} />
                  <Pair label="Carrier" value={p.carrierPreference ?? '-'} />
                  <Pair label="Insurance" value={p.insuranceLevel ?? '-'} />
                  <Pair label="Base rate" value={`${(p.baseRateCents / 100).toFixed(2)} ${p.id ? 'USD' : ''}`} />
                </dl>
              </li>
            ))}
          </ul>
        )}
      </AdminPageBody>
    </>
  )
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow text-ink-muted">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  )
}
