import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-sans tracking-[0.02em]',
    'border border-transparent',
    'transition-[background-color,color,border-color,box-shadow] duration-300',
    'ease-[var(--ease-editorial)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-greek-teal focus-visible:ring-offset-2 focus-visible:ring-offset-parchment',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      // Phase Colors revision: primary CTA shifts to terracotta with a
      // sun-gold hover — warm clay base, ceremonial highlight on intent.
      // The legacy ink-on-parchment button is preserved as `ink` for
      // moments where the warmer terracotta would compete with imagery.
      variant: {
        primary:
          'bg-greek-terracotta text-parchment hover:bg-sun-gold hover:text-ink',
        ink: 'bg-ink text-parchment hover:bg-olive-deep',
        olive: 'bg-olive text-parchment hover:bg-olive-deep',
        // Secondary surface: temple-stone ground with a teal interaction
        // border — quiet, but unmistakably a Greek room.
        stone:
          'bg-temple-stone text-ink border-greek-teal/30 hover:border-greek-teal hover:text-greek-teal-deep',
        outline:
          'bg-transparent text-ink border-ink/30 hover:border-greek-teal hover:text-greek-teal-deep',
        ghost: 'bg-transparent text-ink hover:text-greek-teal-deep',
        gold:
          'bg-transparent text-antique-gold border-antique-gold hover:bg-antique-gold hover:text-ink',
        link:
          'bg-transparent text-ink underline underline-offset-4 decoration-greek-teal/60 hover:decoration-greek-teal hover:text-greek-teal-deep px-0',
      },
      size: {
        sm: 'h-9 px-4 text-caption',
        md: 'h-11 px-6 text-caption',
        lg: 'h-14 px-8 text-subtitle',
        xl: 'h-16 px-10 text-subtitle',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
