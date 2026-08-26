'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * The Pinterest tag, for the headless storefront.
 *
 * Shopify's Pinterest app installs a pixel on Shopify-hosted surfaces —
 * which here means checkout only. Everything a visitor sees before checkout
 * is served by this Next.js app on Vercel, so Pinterest was blind to the
 * entire storefront: no page views, no product views, no retargeting pool,
 * and nothing for campaign optimization to learn from. This closes that gap.
 *
 * Deliberately narrow:
 *   - PageVisit only. Purchases already fire from Shopify's checkout pixel;
 *     sending them from here too would double-count conversions.
 *   - No enhanced match, no customer PII of any kind. Hashed email/name/
 *     phone uploads are a privacy decision for the owner, made in Pinterest's
 *     own settings, not silently in code.
 *   - Dark unless NEXT_PUBLIC_PINTEREST_TAG_ID is set, so a missing env var
 *     is a no-op rather than a broken script tag.
 *
 * CSP: script-src carries 'strict-dynamic' with a per-request nonce, so the
 * nonced loader below is allowed to pull s.pinimg.com without whitelisting
 * the host. The tracking pixel itself needs ct.pinterest.com in img-src and
 * connect-src — see src/middleware.ts.
 */

declare global {
  interface Window {
    // Pinterest's global. Loose by nature: it is a queue before core.js
    // lands and a function afterwards.
    pintrk?: ((...args: unknown[]) => void) & {
      queue?: unknown[]
      version?: string
    }
  }
}

const TAG_ID = process.env.NEXT_PUBLIC_PINTEREST_TAG_ID

export function PinterestTag() {
  const pathname = usePathname()
  const loaded = useRef(false)

  // Client-side navigations don't re-run the loader, so page views after the
  // first would go unreported without this. The first view is fired by the
  // loader itself, hence the ref guard.
  useEffect(() => {
    if (!TAG_ID) return
    if (!loaded.current) {
      loaded.current = true
      return
    }
    window.pintrk?.('page')
  }, [pathname])

  if (!TAG_ID) return null

  return (
    <Script id="pinterest-tag" strategy="afterInteractive">
      {`
!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(
Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";
var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];
r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load', '${TAG_ID}');
pintrk('page');
`}
    </Script>
  )
}
