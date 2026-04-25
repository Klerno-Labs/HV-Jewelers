import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { ERA_LABELS, ERA_POLICY_DEFAULTS } from '@/lib/products/eras'

export default async function AdminPoliciesPage() {
  await requireStaffOrAdmin()
  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Policies"
        description="Default return policy by era. Each product can override these; the line-level snapshot at purchase is what governs the customer's order."
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
              {Object.entries(ERA_POLICY_DEFAULTS).map(([era, p]) => (
                <tr key={era}>
                  <td className="px-6 py-4 text-ink">{ERA_LABELS[era as keyof typeof ERA_LABELS]}</td>
                  <td className="px-6 py-4 text-ink-soft">
                    {p.isFinalSale ? 'Yes' : 'No'}
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
          Vintage Era, Near Vintage, and Jade default to final sale. Modern
          Fine pieces default to a 15-day window for unworn returns. Resizing
          a piece voids the return window per the resize-voids-return flag on
          the product. Damage and not-as-described claims follow a separate
          remedy path defined in policy copy.
        </p>
      </AdminPageBody>
    </>
  )
}
