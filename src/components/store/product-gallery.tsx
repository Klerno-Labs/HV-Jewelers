'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'

export interface GalleryImage {
  url: string
  alt: string | null
  width: number | null
  height: number | null
  caption: string | null
}

/**
 * Product gallery — main image, thumbnail strip, and a lightbox for
 * close-up viewing. Keyboard accessible (←/→ to step through, ESC to
 * close lightbox). Falls back to an editorial-safe placeholder when no
 * images are present.
 */
export function ProductGallery({
  images,
  productTitle,
}: {
  images: GalleryImage[]
  productTitle: string
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  const safeIndex = Math.min(Math.max(activeIdx, 0), Math.max(images.length - 1, 0))
  const active = images[safeIndex]

  const step = useCallback(
    (delta: number) => {
      if (images.length === 0) return
      setActiveIdx((i) => (i + delta + images.length) % images.length)
    },
    [images.length],
  )

  // Lightbox keyboard + body-scroll handling.
  useEffect(() => {
    if (!zoomOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [zoomOpen, step])

  if (images.length === 0 || !active) {
    return <PlaceholderImage title={productTitle} />
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        className="group relative block aspect-4/5 w-full overflow-hidden bg-limestone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
        aria-label="Open close-up view"
      >
        <Image
          src={active.url}
          alt={active.alt ?? productTitle}
          width={active.width ?? 1600}
          height={active.height ?? 2000}
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.02]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-4 bg-parchment/90 px-2.5 py-1 text-eyebrow text-ink-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          Close-up ⤢
        </span>
      </button>

      {images.length > 1 ? (
        <ul
          aria-label="Other views of this piece"
          className="mt-4 flex gap-3 overflow-x-auto pb-2"
        >
          {images.map((img, i) => (
            <li key={`${img.url}-${i}`}>
              <button
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-current={i === safeIndex ? 'true' : undefined}
                aria-label={`View ${i + 1} of ${images.length}`}
                className={cn(
                  'relative block h-24 w-20 flex-none overflow-hidden bg-limestone transition-opacity duration-200',
                  i === safeIndex ? 'opacity-100' : 'opacity-65 hover:opacity-90',
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  width={img.width ?? 200}
                  height={img.height ?? 250}
                  sizes="80px"
                  className="h-full w-full object-cover"
                />
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-px transition-colors duration-200',
                    i === safeIndex ? 'bg-bronze' : 'bg-transparent',
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {zoomOpen ? (
        <Lightbox
          image={active}
          productTitle={productTitle}
          index={safeIndex}
          total={images.length}
          onClose={() => setZoomOpen(false)}
          onStep={step}
        />
      ) : null}
    </div>
  )
}

function Lightbox({
  image,
  productTitle,
  index,
  total,
  onClose,
  onStep,
}: {
  image: GalleryImage
  productTitle: string
  index: number
  total: number
  onClose: () => void
  onStep: (delta: number) => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Close-up of ${productTitle}`}
      className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between p-4 md:p-6">
        <p className="text-eyebrow text-parchment-warm/70">
          {index + 1} / {total}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-caption tracking-wide text-parchment underline underline-offset-4 decoration-antique-gold/60 transition-colors hover:text-antique-gold-soft hover:decoration-antique-gold"
          aria-label="Close close-up"
        >
          Close
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-8 md:px-12">
        <Image
          src={image.url}
          alt={image.alt ?? productTitle}
          width={image.width ?? 2000}
          height={image.height ?? 2500}
          sizes="(min-width: 1024px) 80vw, 95vw"
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {total > 1 ? (
        <div className="flex items-center justify-between gap-6 px-4 pb-8 md:px-12">
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="text-caption tracking-wide text-parchment-warm transition-colors hover:text-antique-gold-soft"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            className="text-caption tracking-wide text-parchment-warm transition-colors hover:text-antique-gold-soft"
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  )
}

function PlaceholderImage({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toUpperCase() || '·'
  return (
    <div className="relative aspect-4/5 w-full overflow-hidden bg-limestone">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-parchment-warm)_0%,var(--color-limestone)_72%)]"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-display-lg text-bronze/40">{initial}</span>
      </div>
    </div>
  )
}
