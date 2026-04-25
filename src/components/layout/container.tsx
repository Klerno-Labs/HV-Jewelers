import { cn } from '@/lib/cn'

type ContainerProps = React.ComponentPropsWithoutRef<'div'> & {
  width?: 'reading' | 'default' | 'wide'
}

const widths: Record<NonNullable<ContainerProps['width']>, string> = {
  reading: 'max-w-[min(720px,92vw)]',
  default: 'max-w-[min(1360px,92vw)]',
  wide: 'max-w-[min(1600px,94vw)]',
}

export function Container({
  className,
  width = 'default',
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-6 md:px-10', widths[width], className)}
      {...props}
    >
      {children}
    </div>
  )
}
