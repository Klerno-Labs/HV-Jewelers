'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'

export type GalleryMedia =
  | {
      kind: 'image'
      url: string
      alt: string | null
      width: number | null
      height: number | null
    }
  | {
      kind: 'video'
      src: string
      mimeType: string
      poster: string | null
      alt: string | null
      width: number | null
      height: number | null
    }

/** Back-compat alias for callers that only build image lists. */
export type GalleryImage = Extract<GalleryMedia, { kind: 'image' }>

/**
 * Product gallery — main media (image or Shopify-hosted video), a
 * thumbnail strip, and a lightbox for close-up viewing. Keyboard
 * accessible (←/→ to step, ESC to close). Videos play inline with native
 * controls (and native fullscreen). Falls back to an editorial-safe
 * placeholder when no media is present.
 */
export function ProductGallery({
  media,
  productTitle,
}: {
  media: GalleryMedia[]
  productTitle: string
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  const safeIndex = Math.min(Math.max(activeIdx, 0), Math.max(media.length - 1, 0))
  const active = media[safeIndex]

  const step = useCallback(
    (delta: number) => {
      if (media.length === 0) return
      setActiveIdx((i) => (i + delta + media.length) % media.length)
    },
    [media.length],
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

  if (media.length === 0 || !active) {
    return <PlaceholderImage title={productTitle} />
  }

  return (
    <div>
      {active.kind === 'image' ? (
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
      ) : (
        <video
          key={active.src}
          controls
          playsInline
          preload="metadata"
          poster={active.poster ?? undefined}
          aria-label={active.alt ?? `${productTitle} — video`}
          className="aspect-4/5 w-full bg-limestone object-cover"
        >
          <source src={active.src} type={active.mimeType} />
        </video>
      )}

      {media.length > 1 ? (
        <ul
          aria-label="Other views of this piece"
          className="mt-4 flex gap-3 overflow-x-auto pb-2"
        >
          {media.map((item, i) => (
            <li key={`${mediaKey(item)}-${i}`}>
              <button
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-current={i === safeIndex ? 'true' : undefined}
                aria-label={
                  item.kind === 'video'
                    ? `Play video — view ${i + 1} of ${media.length}`
                    : `View ${i + 1} of ${media.length}`
                }
                className={cn(
                  'relative block h-24 w-20 flex-none overflow-hidden bg-limestone transition-opacity duration-200',
                  i === safeIndex ? 'opacity-100' : 'opacity-65 hover:opacity-90',
                )}
              >
                <ThumbVisual item={item} />
                {item.kind === 'video' ? (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/55 backdrop-blur-sm">
                      <PlayGlyph />
                    </span>
                  </span>
                ) : null}
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
          item={active}
          productTitle={productTitle}
          index={safeIndex}
          total={media.length}
          onClose={() => setZoomOpen(false)}
          onStep={step}
        />
      ) : null}
    </div>
  )
}

function ThumbVisual({ item }: { item: GalleryMedia }) {
  const poster = item.kind === 'image' ? item.url : item.poster
  if (!poster) {
    return (
      <span
        aria-hidden
        className="block h-full w-full bg-[radial-gradient(ellipse_at_center,var(--color-parchment-warm)_0%,var(--color-limestone)_72%)]"
      />
    )
  }
  return (
    <Image
      src={poster}
      alt=""
      width={item.width ?? 200}
      height={item.height ?? 250}
      sizes="80px"
      className="h-full w-full object-cover"
    />
  )
}

function Lightbox({
  item,
  productTitle,
  index,
  total,
  onClose,
  onStep,
}: {
  item: GalleryMedia
  productTitle: string
  index: number
  total: number
  onClose: () => void
  onStep: (delta: number) => void
}) {
  // Fit-to-screen by default; click the image (or the button) to zoom in to
  // full resolution and scroll/pan around the detail. Reset zoom whenever the
  // shown media changes.
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => {
    setZoomed(false)
  }, [item])

  const isImage = item.kind === 'image'

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

      {/* min-h-0 lets this flex child actually shrink so object-contain fits
          the viewport instead of overflowing. When zoomed, it scrolls. */}
      <div
        className={cn(
          'flex min-h-0 flex-1 px-4 pb-2 md:px-12',
          zoomed
            ? 'overflow-auto'
            : 'items-center justify-center overflow-hidden',
        )}
      >
        {isImage ? (
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
            className={cn('m-auto block', zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in')}
          >
            <Image
              src={item.url}
              alt={item.alt ?? productTitle}
              width={item.width ?? 2000}
              height={item.height ?? 2500}
              sizes={zoomed ? '150vw' : '(min-width: 1024px) 80vw, 95vw'}
              className={cn(
                zoomed
                  ? 'h-auto w-auto max-w-none'
                  : 'max-h-[calc(100vh-9rem)] max-w-full object-contain',
              )}
            />
          </button>
        ) : (
          <video
            key={item.src}
            controls
            autoPlay
            playsInline
            poster={item.poster ?? undefined}
            aria-label={item.alt ?? `${productTitle} — video`}
            className="m-auto max-h-[calc(100vh-9rem)] max-w-full object-contain"
          >
            <source src={item.src} type={item.mimeType} />
          </video>
        )}
      </div>

      <div className="flex items-center justify-between gap-6 px-4 pb-6 pt-3 md:px-12">
        {isImage ? (
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="text-caption tracking-wide text-parchment-warm transition-colors hover:text-antique-gold-soft"
          >
            {zoomed ? 'Fit to screen' : 'Zoom in ⤢'}
          </button>
        ) : (
          <span />
        )}
        {total > 1 ? (
          <div className="flex items-center gap-6">
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
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}

function PlayGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M3 2.2v7.6a.5.5 0 0 0 .77.42l5.7-3.8a.5.5 0 0 0 0-.84l-5.7-3.8A.5.5 0 0 0 3 2.2Z"
        fill="var(--color-parchment, #f7f3ea)"
      />
    </svg>
  )
}

function mediaKey(item: GalleryMedia): string {
  return item.kind === 'image' ? item.url : item.src
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
