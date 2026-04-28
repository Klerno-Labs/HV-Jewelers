'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/auth.config'
import { cn } from '@/lib/cn'

interface NavItem {
  label: string
  href: string
  /// Roles that can see this item. ADMIN sees everything by default.
  roles?: UserRole[]
}

interface NavGroup {
  heading: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Catalog',
    items: [
      { label: 'Products', href: '/admin/products' },
      { label: 'Collections', href: '/admin/collections' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Orders', href: '/admin/orders' },
      { label: 'Inventory', href: '/admin/inventory' },
      { label: 'Shipping', href: '/admin/shipping' },
      { label: 'Policies', href: '/admin/policies' },
    ],
  },
  {
    heading: 'Editorial',
    items: [
      { label: 'Homepage', href: '/admin/homepage' },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { label: 'Users & Staff', href: '/admin/users', roles: ['ADMIN'] },
      { label: 'Audit Log', href: '/admin/audit' },
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
                  pathname === item.href || pathname?.startsWith(`${item.href}/`)
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
