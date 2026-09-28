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

## Update, 28 September 2026: reopening the enquiry path only

`ENABLE_ENTERPRISE=true` no longer reopens the whole enterprise app. It opens only what a customer
needs to send an enquiry, and FAYFORT answers enquiries in Fayfort Ops instead of the admin pages
here (`src/proxy.ts`):

| Opens | Needs sign-in |
|---|---|
| `/login`, `/register`, `/check-email`, `/verify-email`, `/forgot-password`, `/reset-password`, `/unauthorized`, `/auth/callback`, `/api/auth/verify` | No |
| `/catalog`, `/catalog/*`, `/dashboard`, `/dashboard/requests`, `/dashboard/requests/*`, `/dashboard/notifications` | Yes |

Everything else stays 404 whatever the switch says: `/admin`, `/request`, invoices, profile,
settings, `/debug`, `/about`, and every other `/api` route (so items 1, 5 and 6 above stay out of
reach). Verified on a production build, both with the switch on and off.

Status of the list above for the enquiry path:

| Item | Status |
|---|---|
| 1. `/api/users` | Closed. Role changes it makes now go to `app_metadata`. |
| 2. Roles in `user_metadata` | **Fixed.** Every role check reads `app_metadata` through `roleOf()` (`src/lib/auth/role.ts`); a user without one is a customer. Sign-up no longer stores a role. |
| 3. `getSession()` in middleware | **Fixed** (in the Next 16 upgrade). `ProtectedRoute` now uses `getUser()` too. |
| 4. Paths containing `.` | **Fixed.** The proxy only lets through build output, `/public` folders and top-level files; the matcher no longer skips paths by image extension, which let `/api/products/media/x.png` reach a route without the gate. |
| 5. Routes without authorization | Closed, except `/api/auth/verify`, which acts only on the caller's own verification token. |
| 6. Registration rate limit | Sign-up goes straight to Supabase Auth (`/api/auth/register` is unused and closed), so Supabase's Auth rate limits apply. Check them under Authentication > Rate Limits. |
| 7. Logging IDs and roles | **Fixed.** No per-request logging, no `x-user-*` headers. `ProtectedRoute` no longer prints the session (access and refresh tokens) to the browser console. |
| 8. Retention | Open. |

New findings, fixed:

- `/auth/callback` saved the `role` query parameter into `public.users`, so a sign-in link ending
  in `&role=admin` recorded an admin. It now only creates a missing profile, as a customer.
- Registration offered a "Sell Products" (supplier) role to anyone. It is customer-only now.
- `services/authService.ts` (unused) trusted a role kept in `localStorage`. Removed.

**New database, 28 September 2026.** Nobody could sign in to the old Supabase project
(`uxbakpeeqydatgvvdyaa`), so the site now uses a new one, `uswsmbhkedbehkotxngm`, built from
`supabase/schema.sql` (the old schema was never checked in; this one is rebuilt from what the code
reads and writes). Row-level security is part of it from the start:

- Customers see and send only their own requests (always as pending, never with tracking or
  resolution fields), see their own history, invoices and notifications, mark notifications read,
  join the finance waitlist as themselves, and browse the catalog. They can withdraw a request only
  while it is pending; a request with an invoice can't be deleted at all.
- Signed-out visitors get nothing; product images are public files in the `products` bucket.
- Every new profile is a customer, whatever the sign-up form sends, and confirming the email makes
  it active. Customers can't change their role or status, or call any database function.
- Every status a request passes through is recorded in `status_history` by the database.
- Fayfort Ops uses the secret key, which these rules don't limit.

Applied, then checked on the live project with 49 cases in a rolled-back transaction (another
customer's data, approving, setting a role, deleting invoices, writing history, signed-out access and
database functions are all refused): all pass, and nothing was left behind. With these rules the
approve/reject buttons left in the customer dashboard, and deleting shipped requests, are refused:
approving, rejecting and archiving are FAYFORT's to do.

**Still required before switching it on:**

1. **Point the deployment at the new project.** In Vercel, set `NEXT_PUBLIC_SUPABASE_URL` to
   `https://uswsmbhkedbehkotxngm.supabase.co` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to its publishable
   key. In Supabase, under Authentication > URL Configuration, set the Site URL to
   `https://www.fayfort.com` and allow `https://www.fayfort.com/**` as a redirect URL; set up Google
   or Facebook sign-in there again if they are wanted.
2. **Add the catalog.** The new project has no products, so there is nothing to request until
   FAYFORT adds some (Table Editor, or Fayfort Ops).
3. **Grant admins in `app_metadata`** if anyone needs an admin role in the site; nobody has one
   (see `src/lib/auth/role.ts`).

**The old project** still holds whatever customers entered before, and possibly a service-role key
that was public: from 9 January to 7 February 2025 (commits `0bd1df0` to `2f1eb76`) the code read
`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, and any build in that window with the variable set put it
in the site's JavaScript. The owner of `uxbakpeeqydatgvvdyaa` (most likely the account behind
prolifixs.pj@gmail.com) should export anything worth keeping and delete that project.

## Deferred (reason · review by 24 October 2026)

| Item | Reachability | Reason |
|---|---|---|
| Next.js advisories fixed only in 15.5.24+ (includes critical image-optimizer RCE with AVIF, Server Components DoS) | Runtime. On Vercel, image optimization runs on Vercel's platform, and remote image hosts are now exact-match only | Next 14 is end-of-life; the fix is a major migration (React 19, async request APIs, replacing the deprecated Supabase auth helpers). Plan it as its own project. |
| jspdf 2.5.2 (critical ReDoS/DoS) | Enterprise dashboard only, client-side | Fix requires jspdf 4 (major). |
| eslint-config-next 14 → glob CLI injection | Lint tooling only | Fix requires eslint-config-next 16 (major). |
| In-range transitive advisories (canvg, js-cookie, flatted, fast-uri, ws, serialize-javascript, browserslist, minimatch…) | Mostly build and dev tooling | `npm audit fix` would also move `@supabase/supabase-js` 2.47 → 2.117, which cannot be tested until the enterprise app has credentials. |
| CSP allows `'unsafe-inline'` scripts | Runtime | Next.js inline bootstrap scripts; move to a nonce-based CSP with the Next 15 migration. |
| Shopify Buy Button SDK loaded from the unversioned `latest` URL, no subresource integrity | Runtime, on `/ebook/landed` | Shopify publishes the embed this way; pin a version if Shopify offers one. |
