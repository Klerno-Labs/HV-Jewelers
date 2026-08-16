# HV Jewelers — Claude Code project context

Headless **Next.js 15 (App Router) + React 19** storefront on the **Shopify Storefront API**, deployed on Vercel. `main` is the source of truth. **There is no database and no authenticated surface** — Prisma, Auth.js, `/admin`, `/account`, the audit log, and the newsletter capture were all removed (2026-08-11). Shopify owns all commerce; the site is a read-only Shopify client. Anything that needs managing is managed in Shopify admin.

## Current state (2026-06-25)

The **understated immersive homepage is activated and committed on `main`** — an atmospheric R3F/three hero (gold dust, light ramp, fog; **no centered 3D object yet**) + Gold/Fine story panels + product rows + showcase, with smooth scrolling (Lenis) and sitewide Organization/WebSite + per-PDP Product JSON-LD.

Recent commits: dependency hygiene → additive immersive port → tag-based product queries → SmoothScrollProvider + structured data → homepage activation → Product JSON-LD. All green: `npm run type-check`, `npm run build` (28 routes), `npm run lint` (2 known pre-existing warnings). `/` First Load ≈ 168 kB (three.js dynamic, `ssr:false`).

## The next milestone: the "3D glass cases / tray" experience (NOT built yet)

The north-star vision is a scroll-driven luxury experience — **glass display cases** with **trays that draw forward** to present pieces ("walking through a jewelry store, restrained and elegant"). **This is unbuilt** — the current homepage is the deliberately-shipped *understated* launch version. Building glass cases/trays is a net-new **design + implementation** effort on top of the existing R3F foundation (`scroll-stage.tsx`, `scene-canvas.tsx`, the `CenterpieceAnchor` in `hero-scene.tsx`).

Read `docs/NORTH-STAR-brief.md` first — it is the governing vision + locked/open decisions. Also: `docs/immersive-3d-shopify.md` (how the scroll/3D system works), `docs/AUDIT-2026-06-25-pre-3d-homepage.md`, and the `PHASE*` / `PROJECT-BRIEF` docs.

## Key directories

- `src/app/page.tsx` — the immersive homepage composition.
- `src/components/immersive/**` — 3D/scroll system (hero, scene-canvas, scroll-stage, story-panels, product-showcase, smooth-scroll-provider, hover-tilt, parallax-plate).
- `src/components/seo/` — structured-data (Organization/WebSite) + product-jsonld.
- `src/lib/shopify/` — Storefront API client, products (incl. `listProductsByTag`), cart, queries.

## Do-not-break (protected systems — re-confirm before touching)

Cart (`src/lib/shopify/cart.ts`, `src/app/shop/actions.ts`), Shopify-hosted checkout, the HMAC webhook (`src/app/api/shopify/webhook/route.ts`), the security middleware (CSP/nonce/canonical in `src/middleware.ts`), and the SEO surfaces (`sitemap.ts`, `robots.ts`, `google-feed.xml`, `/shop`, `/shop/[handle]`).

The rate limiter (`src/lib/rate-limit.ts`) must never throw: an unconfigured limiter falls back to an in-process sliding window, because a missing env var previously 500'd every cart action.

## Non-negotiables (from the brief)

SEO is the primary acquisition strategy: keep `/`, `/shop`, and PDPs **server-rendered and crawlable** (LCP = the text headline). All motion must respect `prefers-reduced-motion`; never hijack touch scrolling; three.js stays dynamically imported. Light palette only — no dark section grounds.

## Commands

`npm run dev` · `npm run build` · `npm run type-check` · `npm run lint`. Env in `.env.local` (Shopify configured). Local DB may not resolve outside prod — the subscriber count fails soft (`{count:0}`), which is expected locally.
