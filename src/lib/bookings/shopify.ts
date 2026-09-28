import 'server-only'

// Reads orders from the FAYFORT Shopify store with the Dev Dashboard app Fayfort Ops also uses
// (read_orders, read_customers). Server only: the client secret never reaches the browser.
const API_VERSION = '2026-07'

export const shopDomain = () =>
  (process.env.SHOPIFY_STORE_DOMAIN?.trim() || '8kjjz9-ei.myshopify.com').replace(/^https?:\/\//, '').replace(/\/.*$/, '')

// SHOPIFY_API_ORIGIN points at a local stand-in while testing. It is ignored in production, so a
// stray setting can never send the client secret anywhere but the store.
const testOrigin = process.env.NODE_ENV === 'production' ? undefined : process.env.SHOPIFY_API_ORIGIN?.trim().replace(/\/$/, '')
export const shopOrigin = () => testOrigin || `https://${shopDomain()}`

export class ShopifyUnavailable extends Error {}

// Client-credentials tokens last 24 hours: keep one per server instance and renew it early.
let cached: { token: string; expiresAt: number } | undefined

async function accessToken() {
  const legacy = process.env.SHOPIFY_ADMIN_TOKEN?.trim()
  if (legacy) return legacy
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) throw new ShopifyUnavailable('SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are not set')
  if (cached && cached.expiresAt > Date.now() + 5 * 60_000) return cached.token

  const response = await fetch(`${shopOrigin()}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new ShopifyUnavailable(`Shopify token request failed (${response.status})`)
  const { access_token, expires_in } = (await response.json()) as { access_token: string; expires_in: number }
  cached = { token: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}

/** Runs one Admin GraphQL query and returns its data; any failure is ShopifyUnavailable. */
export async function adminQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${shopOrigin()}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await accessToken() },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new ShopifyUnavailable(`Shopify returned ${response.status}`)
  const body = (await response.json()) as { data?: T; errors?: { message: string }[] }
  if (!body.data) throw new ShopifyUnavailable(body.errors?.[0]?.message ?? 'Shopify returned no data')
  return body.data
}
