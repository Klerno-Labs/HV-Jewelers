/**
 * Per-navigation wrapper. Next.js remounts `template.tsx` on every route
 * change (unlike `layout.tsx`), so the `hv-page-in` keyframe gives each page a
 * quiet fade-and-rise entrance. Pure CSS — prefers-reduced-motion snaps it to
 * the end state (see globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="hv-page-in">{children}</div>
}
