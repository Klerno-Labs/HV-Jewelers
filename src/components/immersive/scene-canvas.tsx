'use client'

import { Component, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { cn } from '@/lib/cn'

/**
 * SceneCanvas — R3F canvas wrapper with graceful degradation.
 *
 * Always import this with `next/dynamic` + `ssr: false` from a client
 * component so three.js stays out of the server bundle and only loads
 * on pages that render a scene.
 *
 * Degradation layers:
 *  1. WebGL unsupported → renders `fallback` (static imagery) instead.
 *  2. Context creation/render throws → internal error boundary swaps
 *     to `fallback` rather than crashing the page.
 *
 * Performance defaults per the redesign plan: DPR capped at 1.75 and a
 * transparent buffer so the parchment page ground shows through.
 */

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ?? canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function SceneCanvas({
  className,
  fallback = null,
  camera,
  active = true,
  children,
}: {
  className?: string
  /// Rendered instead of the canvas when WebGL is unavailable or fails.
  fallback?: ReactNode
  camera?: { position?: [number, number, number]; fov?: number }
  /// When false the render loop is suspended ('never') — pass the
  /// stage's in-view state so offscreen scenes cost zero GPU/CPU.
  active?: boolean
  children: ReactNode
}) {
  // Lazy initializer: probed once on mount, never re-checked.
  const [supported] = useState(webglAvailable)

  if (!supported) return <>{fallback}</>

  return (
    <SceneErrorBoundary fallback={fallback}>
      <Canvas
        className={cn('h-full w-full', className)}
        camera={camera}
        dpr={[1, 1.75]}
        frameloop={active ? 'always' : 'never'}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        {children}
      </Canvas>
    </SceneErrorBoundary>
  )
}
