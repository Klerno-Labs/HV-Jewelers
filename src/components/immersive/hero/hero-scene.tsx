'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import type {
  DirectionalLight,
  FogExp2,
  Group,
  PointLight,
  Points,
} from 'three'
import { SceneCanvas } from '@/components/immersive/scene-canvas'

/**
 * HeroScene — the scroll-driven atmosphere of the homepage hero.
 *
 * Per Chris's direction (2026-06-11): no placeholder object. The scene
 * is pure atmosphere — two depths of drifting gold dust, a warm light
 * ramp, and fog that clears as you scroll ("haze → clarity"). The
 * typographic composition carries the hero.
 *
 * <CenterpieceAnchor/> still receives the full camera/scroll/pointer
 * choreography. When the real product scan lands at
 * `public/models/hero.glb`, render a drei `useGLTF` mesh inside it
 * (origin-centered, ~2.2 units tall) and the piece inherits the
 * presentation turn, settle position, and light ramp unchanged. Keep
 * it understated — feedback on the old placeholder was that a large
 * centered object reads as intrusive.
 *
 * Pointer parallax uses R3F's normalized `state.pointer`; touch
 * devices don't emit it, so mobile gets the pure scroll path.
 * `prefers-reduced-motion` stills the autonomous dust drift; scroll
 * mapping remains (user-initiated, not autonomous motion).
 *
 * The canvas is transparent — the parchment haze/clarity ground is a
 * CSS layer in HeroStage, so the WebGL-less fallback looks identical
 * minus the dust.
 */

const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * Empty, fully choreographed slot for the real product model.
 * TODO(GLB): `const { scene } = useGLTF('/models/hero.glb')` and
 * render `<primitive object={scene} />` here.
 */
function CenterpieceAnchor({ anchor }: { anchor: React.RefObject<Group | null> }) {
  return <group ref={anchor} position={[1.6, 0.5, 0]} rotation={[-0.12, 0, 0.18]} />
}

function GoldDust({
  count,
  size,
  opacity,
  spread,
  speed,
  reduced,
}: {
  count: number
  size: number
  opacity: number
  spread: [number, number, number]
  speed: number
  reduced: boolean
}) {
  const ref = useRef<Points>(null)

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * spread[0]
      array[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
      array[i * 3 + 2] = (Math.random() - 0.5) * spread[2] - 2
    }
    return array
  }, [count, spread])

  useFrame((state, delta) => {
    const points = ref.current
    if (!points || reduced) return
    points.rotation.y += delta * speed
    // slow vertical breathing so the field feels suspended, not static
    points.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.18
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8b6a3c"
        size={size}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function HeroRig({ progress }: { progress: MotionValue<number> }) {
  const anchor = useRef<Group>(null)
  const keyLight = useRef<DirectionalLight>(null)
  const warmLight = useRef<PointLight>(null)
  const fog = useRef<FogExp2>(null)

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useFrame((state, delta) => {
    const e = ease(progress.get())

    /* camera: wide + low → close + level, with gentle pointer drift */
    const px = reduced ? 0 : state.pointer.x
    const py = reduced ? 0 : state.pointer.y
    state.camera.position.set(
      e * 0.9 + px * 0.18,
      0.2 + e * 0.35 - py * 0.12,
      7.5 - e * 3.6,
    )
    state.camera.lookAt(0, 0, 0)

    /* centerpiece anchor: idle turn + scroll-driven settle (no-op
       until the GLB renders inside it) */
    const group = anchor.current
    if (group) {
      if (!reduced) group.rotation.y += delta * 0.17
      group.rotation.x = -0.12 + e * 0.3 + py * 0.04
      group.rotation.z = 0.18 - e * 0.18 + px * 0.05
      group.position.set(1.6 - e * 1.0, 0.5 - e * 0.35, 0)
    }

    /* haze → clarity: lights warm up, fog clears */
    if (keyLight.current) keyLight.current.intensity = 0.55 + e * 1.1
    if (warmLight.current) warmLight.current.intensity = 0.5 + e * 0.8
    if (fog.current) fog.current.density = 0.06 - e * 0.042
  })

  return (
    <>
      <fogExp2 ref={fog} attach="fog" args={['#ddd2b5', 0.06]} />
      <ambientLight intensity={0.65} color="#e8e2d1" />
      <directionalLight
        ref={keyLight}
        position={[4, 6, 5]}
        intensity={0.55}
        color="#fff3da"
      />
      <directionalLight position={[-6, 2, -4]} intensity={0.25} color="#4f9bb8" />
      <pointLight
        ref={warmLight}
        position={[-2.5, -1.5, 3]}
        intensity={0.5}
        color="#c6934b"
      />
      <CenterpieceAnchor anchor={anchor} />
      {/* near field: a little larger and brighter, drifts faster */}
      <GoldDust
        count={220}
        size={0.028}
        opacity={0.45}
        spread={[14, 8, 6]}
        speed={0.05}
        reduced={reduced}
      />
      {/* far field: fine, faint, slow — depth without noise */}
      <GoldDust
        count={420}
        size={0.016}
        opacity={0.28}
        spread={[20, 11, 12]}
        speed={0.022}
        reduced={reduced}
      />
    </>
  )
}

export default function HeroScene({
  progress,
  active = true,
}: {
  progress: MotionValue<number>
  /// In-view state from HeroStage; suspends the render loop offscreen.
  active?: boolean
}) {
  return (
    <SceneCanvas
      camera={{ position: [0, 0.2, 7.5], fov: 38 }}
      active={active}
      // The CSS haze ground behind the canvas is the fallback visual;
      // without WebGL the hero is simply the typographic composition.
      fallback={null}
    >
      <HeroRig progress={progress} />
    </SceneCanvas>
  )
}
