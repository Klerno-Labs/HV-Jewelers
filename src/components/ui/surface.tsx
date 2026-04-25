import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const surfaceVariants = cva('', {
  variants: {
    tone: {
      parchment: 'bg-parchment text-ink',
      'parchment-deep': 'bg-parchment-deep text-ink',
      limestone: 'bg-limestone text-ink',
      'limestone-soft': 'bg-limestone/50 text-ink',
      olive: 'bg-olive-deep text-parchment',
      ink: 'bg-ink text-parchment',
    },
    edge: {
      none: '',
      soft: 'border border-limestone-deep/60',
      firm: 'border border-ink/15',
      gold: 'border border-antique-gold/60',
    },
    pad: {
      none: 'p-0',
      xs: 'p-4',
      sm: 'p-6',
      md: 'p-10',
      lg: 'p-14',
    },
  },
  defaultVariants: { tone: 'parchment', edge: 'none', pad: 'none' },
})

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export function Surface({ className, tone, edge, pad, ...props }: SurfaceProps) {
  return (
    <div className={cn(surfaceVariants({ tone, edge, pad }), className)} {...props} />
  )
}
