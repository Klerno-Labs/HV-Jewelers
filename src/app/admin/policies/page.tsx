import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'

/**
 * Era policy reference. Was formerly synthesized from
 * ERA_POLICY_DEFAULTS in src/lib/products/eras.ts; inlined here after
 * the Prisma catalog retirement so a single static page owns the
 * legal copy. The active Shopify product carries its own returns
 * policy in its metafields — these defaults are the in-store
 * convention staff should follow when configuring a piece.
 */

interface EraPolicy {
  era: string
  finalSale: boolean
  returnWindowDays: number
  defaultStockMode: string
}

const POLICIES: EraPolicy[] = [
  { era: 'Vintage Era', finalSale: true, returnWindowDays: 0, defaultStockMode: 'One of one' },
  { era: 'Near Vintage', finalSale: true, returnWindowDays: 0, defaultStockMode: 'One of one' },
  { era: 'Modern Fine Jewelry', finalSale: false, returnWindowDays: 15, defaultStockMode: 'One of one' },
]

export default async function AdminPoliciesPage() {
  await requireStaffOrAdmin()
  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Policies"
        description="Default return policy by era. Each Shopify product can override these via metafields; the active policy at purchase is what governs the customer's order."
      />
      <AdminPageBody>
        <div className="border border-limestone-deep/60 bg-parchment">
          <table className="w-full text-caption">
            <thead className="border-b border-limestone-deep/60 text-eyebrow text-ink-muted">
              <tr>
                <th className="px-6 py-4 text-left">Era</th>
                <th className="px-6 py-4 text-left">Final sale</th>
                <th className="px-6 py-4 text-left">Return window</th>
                <th className="px-6 py-4 text-left">Default stock mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-limestone-deep/40">
              {POLICIES.map((p) => (
                <tr key={p.era}>
                  <td className="px-6 py-4 text-ink">{p.era}</td>
                  <td className="px-6 py-4 text-ink-soft">
                    {p.finalSale ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-ink-soft">
                    {p.returnWindowDays === 0 ? '-' : `${p.returnWindowDays} days`}
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{p.defaultStockMode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-2xl text-caption leading-relaxed text-ink-muted">
          Vintage Era and Near Vintage default to final sale. Modern Fine
          pieces default to a 15-day window for unworn returns. Resizing
          a piece voids the return window per the resize-voids-return flag
          on the product. Damage and not-as-described claims follow a
          separate remedy path defined in policy copy.
        </p>
      </AdminPageBody>
    </>
  )
}
