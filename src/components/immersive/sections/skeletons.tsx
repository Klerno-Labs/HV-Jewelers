import { Container } from '@/components/layout/container'

/**
 * Loading skeletons for the streamed product sections of the home.
 * Quiet parchment blocks in the exact geometry of the real grids, so
 * nothing shifts when live data arrives (CLS-safe).
 */

function CardSkeleton() {
  return (
    <div>
      <div className="aspect-4/5 animate-pulse bg-limestone-deep/50" />
      <div className="mt-4 h-4 w-3/4 animate-pulse bg-limestone-deep/40" />
      <div className="mt-2 h-3 w-1/3 animate-pulse bg-limestone-deep/30" />
    </div>
  )
}

export function ProductRowSkeleton() {
  return (
    <section
      aria-hidden
      className="border-t border-limestone-deep/60"
    >
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </section>
  )
}

export function ShowcaseSkeleton() {
  return (
    <section
      aria-hidden
      className="border-t border-limestone-deep/60 bg-temple-stone"
    >
      <Container className="py-24 md:py-32">
        <div className="h-3 w-24 animate-pulse bg-limestone-deep/50" />
        <div className="mt-5 h-10 w-64 animate-pulse bg-limestone-deep/40" />
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </section>
  )
}
