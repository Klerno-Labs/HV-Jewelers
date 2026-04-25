import { cn } from '@/lib/cn'

/**
 * Admin data-table primitive. Server-rendered — no TanStack Table, no
 * client JS. Sorting and filtering are URL-driven so every table state
 * is a URL, bookmarkable, and doesn't require JS. For 100–150 SKUs and
 * a small order volume this scales comfortably.
 */

export function AdminTable({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        // Phase Colors: subtle terracotta frames the data without competing.
        'overflow-x-auto border border-greek-terracotta/25 bg-parchment',
        className,
      )}
    >
      <table className="w-full border-collapse text-caption">{children}</table>
    </div>
  )
}

export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-greek-terracotta/25 text-eyebrow text-ink-muted">
      {children}
    </thead>
  )
}

export function AdminTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-limestone-deep/40">{children}</tbody>
}

export function Th({
  children,
  className,
  align = 'left',
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <th
      className={cn(
        'px-4 py-4 font-medium tracking-[0.18em]',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
      scope="col"
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <td
      className={cn(
        'px-4 py-4 align-top text-ink',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-ink-muted">
        {message}
      </td>
    </tr>
  )
}
