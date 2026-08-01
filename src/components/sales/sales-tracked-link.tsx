'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import type { ClientSalesEvent } from '@/lib/sales/contracts'
import { trackSalesEvent } from '@/lib/sales/client'

type Props = ComponentProps<typeof Link> & {
  eventType: ClientSalesEvent['eventType']
  productId?: string
}

export function SalesTrackedLink({
  eventType,
  productId,
  onClick,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackSalesEvent({ eventType, productId })
        onClick?.(event)
      }}
    />
  )
}
