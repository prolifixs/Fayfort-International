# Security review — fayfort.com (landed project)

**Date:** 24 September 2026 · **Method:** `security-and-hardening` skill (addyosmani/agent-skills) and its security checklist · **Next review:** 24 October 2026

## Threat model

| Trust boundary | What crosses it | Assets at risk |
|---|---|---|
| Public site pages (`/`, `/services`, `/about-us`, `/terms*`, `/ebook/landed`) | Page requests only; no forms | Site integrity, visitors (XSS, clickjacking) |
| Shopify Buy Button | Third-party script from `sdks.shopifycdn.com`; checkout on `*.myshopify.com` | Checkout flow, payment redirection |
| Next.js image optimizer (`/_next/image`) | URLs chosen by the requester | Server (SSRF, DoS, RCE advisories) |
| Enterprise app (login, register, dashboard, admin, 42 `/api/*` routes) | Auth cookies, form and JSON input, file uploads, Stripe webhooks | Customer PII (profiles, addresses), invoices, payments, admin actions, outbound email |
| Baserow directory views | Password-protected public views | Paid directory content |

The enterprise app is described as dormant, but it is **deployed** on fayfort.com against the real Supabase project (`uxbakpeeqydatgvvdyaa`), confirmed from the live site's JavaScript.

## Fixed in this review

| Finding | Fix |
|---|---|
| No security headers except HSTS | Added CSP (allowlist of what the pages load), `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; removed `X-Powered-By`. Verified: zero CSP violations on every public page; Shopify Buy Button still renders. |
| Image optimizer allowed `**.supabase.co` (open image proxy, SSRF surface) | Restricted to the project's own Supabase host plus YouTube/Vimeo thumbnail hosts. |
| Next.js 14.1.0 (critical, including the middleware auth-bypass advisory CVE-2025-29927) | Upgraded to 14.2.35, the last 14.x release. |
| lodash, form-data runtime advisories; vitest/vite dev advisories | Updated within declared ranges, install scripts disabled; duplicate vite removed. |
| 16 API responses returned raw database/exception messages (schema detail; registration leaked whether an email exists) | Generic error bodies; details stay in server logs. |
| JSON-LD written with unescaped `JSON.stringify` | `<` escaped so no value can close the script tag. |
| Shopify email template holds live directory passwords and would have been committed to this **public** repo | `docs/email/` git-ignored; `*.key` added to `.gitignore`. |
| Baserow Services/Hotels/Restaurants views readable without password | Fixed by the owner in Baserow; all four views now return 401. |
| Dormant enterprise app live in production with the access-control holes listed below | Closed (approved by the owner): middleware serves only the public site and returns 404 for login, register, dashboard, admin and every `/api` route unless `ENABLE_ENTERPRISE=true`. Verified on a production build, including the reopen switch. |

Checked and clean: no secrets in git history (only the Supabase anon key, which is public by design); no tracked env files; all 1,134 installed packages have verified registry signatures.

## Must fix before setting `ENABLE_ENTERPRISE=true`

These are unreachable while the enterprise app is closed, and come back the moment it reopens.

1. **`/api/users` has no admin check.** GET, POST and PATCH use the Supabase service-role client; any signed-in user can list users, create accounts and set any user's role, including `admin`. Registration is public.
2. **Roles come from `user_metadata`,** which users can edit themselves with `supabase.auth.updateUser`. Anyone can mark themselves `admin` for the middleware and UI checks. Roles belong in `app_metadata`, read server-side.
3. **Middleware authenticates with `getSession()`** (the unverified cookie) instead of `getUser()`.
4. **Middleware skips authentication for any path containing `.`**, including dynamic API segments.
5. **Routes without their own authorization,** relying on the middleware alone: product delete/status, `/api/email/send` (any signed-in user can send mail through Resend), and others. The 42 routes were not all audited individually.
6. **No rate limiting** on `/api/auth/register`.
7. Middleware logs user IDs and roles on every request and echoes them in response headers nobody reads.
8. Personal data in Supabase (profiles, addresses) has no defined retention period or deletion path.

## Deferred (reason · review by 24 October 2026)

| Item | Reachability | Reason |
|---|---|---|
| Next.js advisories fixed only in 15.5.24+ (includes critical image-optimizer RCE with AVIF, Server Components DoS) | Runtime. On Vercel, image optimization runs on Vercel's platform, and remote image hosts are now exact-match only | Next 14 is end-of-life; the fix is a major migration (React 19, async request APIs, replacing the deprecated Supabase auth helpers). Plan it as its own project. |
| jspdf 2.5.2 (critical ReDoS/DoS) | Enterprise dashboard only, client-side | Fix requires jspdf 4 (major). |
| eslint-config-next 14 → glob CLI injection | Lint tooling only | Fix requires eslint-config-next 16 (major). |
| In-range transitive advisories (canvg, js-cookie, flatted, fast-uri, ws, serialize-javascript, browserslist, minimatch…) | Mostly build and dev tooling | `npm audit fix` would also move `@supabase/supabase-js` 2.47 → 2.117, which cannot be tested until the enterprise app has credentials. |
| CSP allows `'unsafe-inline'` scripts | Runtime | Next.js inline bootstrap scripts; move to a nonce-based CSP with the Next 15 migration. |
| Shopify Buy Button SDK loaded from the unversioned `latest` URL, no subresource integrity | Runtime, on `/ebook/landed` | Shopify publishes the embed this way; pin a version if Shopify offers one. |
