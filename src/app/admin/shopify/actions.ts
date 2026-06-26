'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireStaffOrAdmin } from '@/lib/auth-helpers'
import { serverEnv, clientEnv } from '@/lib/env'
import { audit, auditRequestContext } from '@/lib/auth/audit'
import { SHOPIFY_TAGS } from '@/lib/shopify/client'

/**
 * Headless Storefront API credentials, written straight to .env + .env.local.
 * STAFF+ only. Token values are never written to the audit log. Env changes
 * take effect after the dev server restarts (local) or a redeploy (prod);
 * env files only configure local — production reads its env from Vercel.
 */

const schema = z.object({
  publicToken: z.string().trim().max(255).optional().nullable(),
  privateToken: z.string().trim().max(255).optional().nullable(),
  storeDomain: z.string().trim().max(255).optional().nullable(),
  apiVersion: z.string().trim().max(20).optional().nullable(),
})

const ENV_FILES = ['.env', '.env.local'] as const

function normDomain(d: string | null | undefined): string | null {
  if (!d) return null
  const host = d.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim()
  return host || null
}

/** Replace the line for each key, or append it if absent. */
function upsertEnvContent(content: string, updates: Record<string, string>): string {
  let out = content
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}="${value}"`
    const re = new RegExp(`^${key}=.*$`, 'm')
    out = re.test(out)
      ? out.replace(re, line)
      : `${out.replace(/\n*$/, '')}\n${line}\n`
  }
  return out.startsWith('\n') ? out.slice(1) : out
}

async function writeEnvFiles(updates: Record<string, string>): Promise<void> {
  const root = process.cwd()
  for (const name of ENV_FILES) {
    const file = path.join(root, name)
    let content = ''
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      content = ''
    }
    await fs.writeFile(file, upsertEnvContent(content, updates), 'utf8')
  }
}

/** Probe a token+domain directly against the Storefront API. Read-only. */
async function probe(
  domain: string,
  apiVersion: string,
  headers: Record<string, string>,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: JSON.stringify({ query: '{ products(first: 50) { edges { node { id } } } }' }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `HTTP ${res.status} ${body.slice(0, 120)}`.trim() }
    }
    const json = (await res.json()) as {
      data?: { products?: { edges?: unknown[] } }
      errors?: Array<{ message: string }>
    }
    if (json.errors?.length) {
      return { ok: false, error: json.errors[0]?.message ?? 'GraphQL error' }
    }
    return { ok: true, count: json.data?.products?.edges?.length ?? 0 }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Request failed' }
  }
}

/** Test the entered token (or the saved env one if left blank). */
export async function testShopifyAction(formData: FormData) {
  await requireStaffOrAdmin()
  const parsed = schema.safeParse({
    publicToken: formData.get('publicToken') || null,
    privateToken: formData.get('privateToken') || null,
    storeDomain: formData.get('storeDomain') || null,
    apiVersion: formData.get('apiVersion') || null,
  })
  const entered = parsed.success ? parsed.data : null

  const domain =
    normDomain(entered?.storeDomain) ||
    normDomain(clientEnv.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN)
  const apiVersion =
    entered?.apiVersion?.trim() ||
    serverEnv.SHOPIFY_STOREFRONT_API_VERSION ||
    '2025-10'
  const priv = entered?.privateToken?.trim() || serverEnv.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
  const pub = entered?.publicToken?.trim() || serverEnv.SHOPIFY_STOREFRONT_TOKEN

  const headers: Record<string, string> | null = priv
    ? { 'Shopify-Storefront-Private-Token': priv }
    : pub
      ? { 'X-Shopify-Storefront-Access-Token': pub }
      : null

  if (!headers || !domain) {
    redirect('/admin/shopify?test=missing')
  }

  const result = await probe(domain, apiVersion, headers)
  if (result.ok) {
    redirect(`/admin/shopify?test=ok&count=${result.count}`)
  }
  redirect(`/admin/shopify?test=fail&msg=${encodeURIComponent(result.error ?? 'unknown')}`)
}

/** Write the entered credentials to .env + .env.local. */
export async function saveShopifyAction(formData: FormData) {
  const { user } = await requireStaffOrAdmin()

  const parsed = schema.safeParse({
    publicToken: formData.get('publicToken') || null,
    privateToken: formData.get('privateToken') || null,
    storeDomain: formData.get('storeDomain') || null,
    apiVersion: formData.get('apiVersion') || null,
  })
  if (!parsed.success) {
    redirect('/admin/shopify?error=invalid')
  }
  const data = parsed.data

  // Only write fields that were filled in — blank keeps the existing env line.
  const updates: Record<string, string> = {}
  const publicToken = data.publicToken?.trim()
  const privateToken = data.privateToken?.trim()
  const storeDomain = normDomain(data.storeDomain)
  const apiVersion = data.apiVersion?.trim()
  if (publicToken) updates.SHOPIFY_STOREFRONT_TOKEN = publicToken
  if (privateToken) updates.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = privateToken
  if (storeDomain) updates.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = storeDomain
  if (apiVersion) updates.SHOPIFY_STOREFRONT_API_VERSION = apiVersion

  if (Object.keys(updates).length === 0) {
    redirect('/admin/shopify?error=empty')
  }

  try {
    await writeEnvFiles(updates)
  } catch (err) {
    console.error('[shopify] writing env files failed', err)
    redirect('/admin/shopify?error=write')
  }

  const ctx = await auditRequestContext()
  await audit({
    actorId: user.id,
    action: 'shopify.config.update',
    resourceType: 'ShopifyConfig',
    resourceId: 'env',
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    // Never log secret values — only which keys changed.
    context: { keys: Object.keys(updates) },
  })

  revalidateTag(SHOPIFY_TAGS.products)
  redirect('/admin/shopify?saved=1')
}
