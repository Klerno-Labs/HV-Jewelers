'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackSalesEvent } from '@/lib/sales/client'

export function SalesPageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    trackSalesEvent({ eventType: 'site_visit' })
  }, [pathname])

  return null
}
export function ProductSalesTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackSalesEvent({ eventType: 'product_view', productId })
  }, [productId])

  return null
}
