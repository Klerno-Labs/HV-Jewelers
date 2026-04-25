'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Subtle scroll-reveal. Fades + lifts a section into view once it
 * intersects the viewport. Honors prefers-reduced-motion by rendering
 * fully visible from the start.
 *
 * No inline styles — uses Tailwind's static delay-* utilities so the
 * strict CSP can stay tight on style-src.
 */

const DELAY_CLASS: Record<number, string> = {
  0: '',
  100: 'delay-100',
  150: 'delay-150',
  200: 'delay-200',
  300: 'delay-300',
}

export function FadeIn({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: 'div' | 'section' | 'article'
  delay?: 0 | 100 | 150 | 200 | 300
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(m.matches)
    if (m.matches) {
      setVisible(true)
      return
    }
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'transition-[opacity,transform] duration-1000 ease-[var(--ease-editorial)]',
        DELAY_CLASS[delay],
        reduced || visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-3 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
