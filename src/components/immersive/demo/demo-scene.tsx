'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import type { Group } from 'three'
import { SceneCanvas } from '@/components/immersive/scene-canvas'

/**
 * Minimal proof scene for the immersive infrastructure (Phase 1).
 * A flat-shaded gold form that spins idly and reacts to ScrollStage
 * progress — the same wiring pattern (MotionValue prop read inside
 * useFrame, never via React state) the Phase 2 hero will use.
 *
 * Default-exported so callers can `next/dynamic(() => import(...))`
 * the whole module and keep three.js out of the initial bundle.
 */

function Gem({ progress }: { progress: MotionValue<number> }) {
  const ref = useRef<Group>(null)

  useFrame((_, delta) => {
    const group = ref.current
    if (!group) return
    const p = progress.get()
    group.rotation.y += delta * 0.4
    group.rotation.x = -0.15 + p * 0.55
    group.scale.setScalar(1 + p * 0.35)
    group.position.y = -0.2 + p * 0.4
  })

  return (
    <group ref={ref}>
      {/* crown */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.7, 1.05, 0.42, 8, 1]} />
        <meshStandardMaterial
          color="#a8843c"
          metalness={1}
          roughness={0.3}
          flatShading
        />
      </mesh>
      {/* pavilion */}
      <mesh position={[0, -0.55, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.05, 1.28, 8, 1]} />
        <meshStandardMaterial
          color="#a8843c"
          metalness={1}
          roughness={0.3}
          flatShading
        />
      </mesh>
    </group>
  )
}

export default function DemoScene({
  progress,
}: {
  progress: MotionValue<number>
}) {
  return (
    <SceneCanvas
      camera={{ position: [0, 0.2, 5.5], fov: 38 }}
      fallback={
        <div
          aria-hidden
          className="h-full w-full bg-[radial-gradient(ellipse_at_70%_30%,var(--color-parchment-warm)_0%,var(--color-limestone-deep)_70%)]"
        />
      }
    >
      <ambientLight intensity={0.9} color="#e8e2d1" />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#fff3da" />
      <directionalLight position={[-6, 2, -4]} intensity={0.4} color="#4f9bb8" />
      <pointLight position={[-2.5, -1.5, 3]} intensity={0.7} color="#c6934b" />
      <Gem progress={progress} />
    </SceneCanvas>
  )
}
