import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { PlaceholderPanel } from '@/components/admin/placeholder-panel'

export default async function AdminProductsPage() {
  await requireStaffOrAdmin()
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="The catalog. Vintage Era, Near Vintage, and Modern Fine pieces, with policy and inventory state."
      />
      <AdminPageBody>
        <PlaceholderPanel
          phase="Phase 7"
          title="Product CRUD arrives next."
          body="Schema, inventory, and policy snapshotting are in place. The full product editor (image uploads, materials and stones, policy flags, inventory units) lands in Phase 7."
        />
      </AdminPageBody>
    </>
  )
}
