'use client'

import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'

/**
 * HoverTilt — the 2.5D card micro-interaction from the approved
 * preview. Pointer position maps to a slight perspective tilt; a
 * spring settles it back on leave.
 *
 * Used on the homepage product cards only — /shop keeps its calmer
 * catalog presentation. No-op (plain children) under reduced motion;
 * touch devices never fire pointermove-with-hover so they get the
 * static card too.
 */
export function HoverTilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), {
    stiffness: 220,
    damping: 22,
  })
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), {
    stiffness: 220,
    damping: 22,
  })

  if (reduced) return <>{children}</>

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onPointerMove={(e) => {
          const rect = ref.current?.getBoundingClientRect()
          if (!rect) return
          px.set((e.clientX - rect.left) / rect.width - 0.5)
          py.set((e.clientY - rect.top) / rect.height - 0.5)
        }}
        onPointerLeave={() => {
          px.set(0)
          py.set(0)
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
