import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { serverEnv, clientEnv } from '@/lib/env'
import {
  AdminPageBody,
  AdminPageHeader,
} from '@/components/admin/page-header'
import { FormField, TextInput } from '@/components/admin/form-fields'
import { saveShopifyAction, testShopifyAction } from './actions'

export const metadata: Metadata = {
  title: 'Shopify API',
  robots: { index: false, follow: false },
}

function mask(token: string | null | undefined): string {
  if (!token) return ''
  if (token.length <= 8) return '••••••••'
  return `${token.slice(0, 4)}…${token.slice(-4)}`
}

export default async function ShopifyConfigPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaffOrAdmin()
  const sp = await searchParams

  const publicToken = serverEnv.SHOPIFY_STOREFRONT_TOKEN ?? null
  const privateToken = serverEnv.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ?? null
  const domain = clientEnv.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? ''
  const apiVersion = serverEnv.SHOPIFY_STOREFRONT_API_VERSION ?? '2025-10'

  const saved = sp.saved === '1'
  const test = typeof sp.test === 'string' ? sp.test : null
  const count = typeof sp.count === 'string' ? sp.count : null
  const testMsg = typeof sp.msg === 'string' ? sp.msg : null
  const error =
    sp.error === 'invalid'
      ? 'Please check the fields and try again.'
      : sp.error === 'empty'
        ? 'Nothing to save — fill in at least one field.'
        : sp.error === 'write'
          ? 'Could not write the env files (read-only filesystem?). On the live site, set these in Vercel instead.'
          : null

  return (
    <>
      <AdminPageHeader
        eyebrow="Settings · Storefront"
        title="Shopify API"
        description="Paste the Headless Storefront API tokens the website reads products with. Saving writes them to .env and .env.local."
        actions={
          <Link
            href="/admin"
            className="text-caption text-ink-soft underline underline-offset-4 decoration-bronze/40 hover:text-olive"
          >
            ← Dashboard
          </Link>
        }
      />
      <AdminPageBody>
        {saved ? (
          <p role="status" className="mb-6 inline-block border-l border-olive bg-olive/10 py-3 pl-4 pr-6 text-caption text-olive">
            Saved to .env and .env.local. Restart the dev server (or redeploy) to apply.
          </p>
        ) : null}
        {test === 'ok' ? (
          <p role="status" className="mb-6 inline-block border-l border-olive bg-olive/10 py-3 pl-4 pr-6 text-caption text-olive">
            ✓ Connected — this token sees <strong>{count}</strong> product{count === '1' ? '' : 's'}.
            {count === '0' ? ' (Valid token, but no products are published to its channel yet.)' : ''}
          </p>
        ) : null}
        {test === 'fail' ? (
          <p role="alert" className="mb-6 inline-block border-l border-cedar-deep bg-cedar/10 py-3 pl-4 pr-6 text-caption text-cedar-deep">
            Connection failed: {testMsg ?? 'unknown error'}
          </p>
        ) : null}
        {test === 'missing' ? (
          <p role="alert" className="mb-6 inline-block border-l border-cedar-deep bg-cedar/10 py-3 pl-4 pr-6 text-caption text-cedar-deep">
            Enter a token + store domain to test (or save one first).
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mb-6 inline-block border-l border-cedar-deep bg-cedar/10 py-3 pl-4 pr-6 text-caption text-cedar-deep">
            {error}
          </p>
        ) : null}

        {/* Current state */}
        <dl className="mb-10 grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2 border border-limestone-deep/60 bg-parchment-warm/30 p-5 text-caption">
          <dt className="text-ink-muted">Public token</dt>
          <dd className="font-mono text-ink">{mask(publicToken) || '—'}</dd>
          <dt className="text-ink-muted">Private token</dt>
          <dd className="font-mono text-ink">{privateToken ? mask(privateToken) : '—'}</dd>
          <dt className="text-ink-muted">Store domain</dt>
          <dd className="font-mono text-ink">{domain || '—'}</dd>
          <dt className="text-ink-muted">API version</dt>
          <dd className="font-mono text-ink">{apiVersion}</dd>
        </dl>

        <form className="max-w-xl space-y-8">
          <FormField
            id="publicToken"
            label="Public access token"
            hint="Shopify → Settings → Apps and sales channels → Headless → Storefront API → public access token. Leave blank to keep the current one."
          >
            <TextInput
              id="publicToken"
              name="publicToken"
              type="password"
              maxLength={255}
              placeholder={publicToken ? `Current: ${mask(publicToken)} — paste a new one to replace` : 'Paste the public access token'}
            />
          </FormField>

          <FormField
            id="privateToken"
            label="Private access token (optional)"
            hint="Same screen, under private access tokens. When set it's used for server-side reads. Leave blank to keep the current one."
          >
            <TextInput
              id="privateToken"
              name="privateToken"
              type="password"
              maxLength={255}
              placeholder={privateToken ? `Current: ${mask(privateToken)} — paste a new one to replace` : 'Optional'}
            />
          </FormField>

          <FormField id="storeDomain" label="Store domain">
            <TextInput
              id="storeDomain"
              name="storeDomain"
              defaultValue={domain}
              maxLength={255}
              placeholder="zvf91s-qy.myshopify.com"
            />
          </FormField>

          <FormField id="apiVersion" label="API version">
            <TextInput
              id="apiVersion"
              name="apiVersion"
              defaultValue={apiVersion}
              maxLength={20}
              placeholder="2025-10"
            />
          </FormField>

          <div className="flex items-center gap-3 border-t border-limestone-deep/60 pt-6">
            <button
              type="submit"
              formAction={saveShopifyAction}
              className="inline-flex h-10 items-center bg-ink px-5 text-caption text-parchment hover:opacity-85"
            >
              Save to .env
            </button>
            <button
              type="submit"
              formAction={testShopifyAction}
              formNoValidate
              className="inline-flex h-10 items-center border border-limestone-deep px-5 text-caption text-ink hover:border-olive"
            >
              Test connection
            </button>
          </div>
        </form>

        <p className="mt-8 max-w-xl text-caption leading-relaxed text-ink-muted">
          Saving writes <code>.env</code> and <code>.env.local</code> in the project.
          Those configure <em>local</em> dev (restart to apply). The live site reads
          its env from Vercel — set the same keys there to update production. If a
          test shows 0 products, the token is fine but the products aren’t published
          to the Headless channel yet (fix in Shopify: Products → select → add the
          Headless channel).
        </p>
      </AdminPageBody>
    </>
  )
}
