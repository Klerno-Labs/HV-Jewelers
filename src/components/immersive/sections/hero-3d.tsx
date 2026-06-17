import { HeroStage } from '@/components/immersive/hero/hero-stage'

/**
 * Hero3D — immersive scroll-driven hero ("The Case").
 *
 * Thin server wrapper; all choreography lives in the client
 * HeroStage, the 3D scene in hero-scene.tsx (dynamically loaded).
 * The h1 (#intro-heading) renders inside HeroStage and is present in
 * server HTML.
 */
export function Hero3D() {
  return (
    <section aria-labelledby="intro-heading" className="relative">
      <HeroStage />
    </section>
  )
}
