import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { PlaceholderPanel } from '@/components/admin/placeholder-panel'

export default async function AdminEditorialPage() {
  await requireStaffOrAdmin()
  return (
    <>
      <AdminPageHeader
        eyebrow="Editorial"
        title="Posts"
        description="Long-form pieces: sourcing notes, jade craft, archive stories."
      />
      <AdminPageBody>
        <PlaceholderPanel
          phase="Phase 9"
          title="Editorial editor arrives with the admin dashboard."
          body="The schema supports rich-text bodies, hero images, and publish states. The MDX-aware editor with image uploads and preview lands in Phase 9."
        />
      </AdminPageBody>
    </>
  )
}
