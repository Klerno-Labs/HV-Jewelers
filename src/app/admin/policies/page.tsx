import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'

/**
 * Return policy reference. A single static page owns the in-store
 * convention staff follow when configuring a piece. The active Shopify
 * product carries its own returns policy in its metafields — these
 * defaults are the house rule. The store holds one of each piece in
 * stock (single-stock), so returns are refunds, not exchanges.
 */

interface PolicyRow {
  category: string
  finalSale: boolean
  returnWindowDays: number
  defaultStockMode: string
}

const POLICIES: PolicyRow[] = [
  { category: 'Most pieces', finalSale: false, returnWindowDays: 15, defaultStockMode: 'One in stock' },
  { category: 'Earrings', finalSale: true, returnWindowDays: 0, defaultStockMode: 'One in stock' },
  { category: 'Resized or engraved', finalSale: true, returnWindowDays: 0, defaultStockMode: 'One in stock' },
]

export default async function AdminPoliciesPage() {
  await requireStaffOrAdmin()
  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Policies"
        description="Default return policy by category. Each Shopify product can override these via metafields; the active policy at purchase is what governs the customer's order."
      />
      <AdminPageBody>
        <div className="border border-limestone-deep/60 bg-parchment">
          <table className="w-full text-caption">
            <thead className="border-b border-limestone-deep/60 text-eyebrow text-ink-muted">
              <tr>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Final sale</th>
                <th className="px-6 py-4 text-left">Return window</th>
                <th className="px-6 py-4 text-left">Default stock mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-limestone-deep/40">
              {POLICIES.map((p) => (
                <tr key={p.category}>
                  <td className="px-6 py-4 text-ink">{p.category}</td>
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
          Most pieces carry a 15-day window for unworn returns in original
          condition. Earrings are final sale for hygiene; resized or
          engraved pieces are final sale. The customer covers insured
          return shipping. Damage and not-as-described claims follow a
          separate remedy path defined in policy copy.
        </p>
      </AdminPageBody>
    </>
  )
}
