'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/auth.config'
import { cn } from '@/lib/cn'

interface NavItem {
  label: string
  href: string
  external?: boolean
  /// Roles that can see this item. ADMIN sees everything by default.
  roles?: UserRole[]
}

interface NavGroup {
  heading: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Content',
    items: [
      { label: 'Policies', href: '/admin/policies' },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { label: 'Users & Staff', href: '/admin/users', roles: ['ADMIN'] },
      { label: 'Audit Log', href: '/admin/audit' },
    ],
  },
  {
    heading: 'Shopify',
    items: [
      { label: 'Products ↗', href: 'https://zvf91s-qy.myshopify.com/admin/products', external: true },
      { label: 'Inventory ↗', href: 'https://zvf91s-qy.myshopify.com/admin/products/inventory', external: true },
      { label: 'Orders ↗', href: 'https://zvf91s-qy.myshopify.com/admin/orders', external: true },
      { label: 'Customers ↗', href: 'https://zvf91s-qy.myshopify.com/admin/customers', external: true },
      { label: 'Discounts ↗', href: 'https://zvf91s-qy.myshopify.com/admin/discounts', external: true },
      { label: 'Shipping ↗', href: 'https://zvf91s-qy.myshopify.com/admin/settings/shipping', external: true },
    ],
  },
]

export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="space-y-8">
      <Link
        href="/admin"
        className={cn(
          'block text-caption tracking-wide transition-colors duration-200',
          pathname === '/admin'
            ? 'text-ink'
            : 'text-ink-soft hover:text-olive',
        )}
      >
        Dashboard
      </Link>

      {NAV_GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.roles || item.roles.includes(role),
        )
        if (items.length === 0) return null
        return (
          <div key={group.heading}>
            <p className="text-eyebrow text-ink-muted mb-3">{group.heading}</p>
            <ul className="space-y-2">
              {items.map((item) => {
                const active =
                  !item.external &&
                  (pathname === item.href || pathname?.startsWith(`${item.href}/`))
                if (item.external) {
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-caption text-ink-soft transition-colors duration-200 hover:text-olive"
                      >
                        {item.label}
                      </a>
                    </li>
                  )
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block text-caption transition-colors duration-200',
                        active
                          ? 'text-ink'
                          : 'text-ink-soft hover:text-olive',
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
