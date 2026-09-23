# Enterprise app (fayfortenterprise) — progress snapshot

Written after a routing audit done while splitting the ebook out into its own project
(see "Recent change" below). This captures what's actually in the codebase today, not
what `ProjectUpdates.md`'s phase log describes — use both together.

## What this app actually is

One Next.js 14.1.0 project (App Router, package name `fayfortenterprise`) containing two
mostly-unrelated things sharing a single root layout:

1. **The Landed ebook landing page** — as of today, extracted into its own project (see
   below). Still present here too, unchanged.
2. **A catalog / customer request / admin / invoicing system** — the actual "enterprise"
   part. This is the one you're planning to build out into a full ERP.

## Route inventory (part 2 — the enterprise system)

- **Auth**: `login`, `register`, `forgot-password`, `reset-password`, `check-email`,
  `verify-email`, `unauthorized`, `auth/callback`
- **Catalog**: `catalog`, `catalog/[id]`
- **Customer dashboard**: `dashboard` (+ `invoices`, `invoices/[id]`,
  `invoices/[id]/preview`, `notifications`, `profile` with `addresses`/`preferences`/
  `profileInfo`/`social` sub-pages, `requests`, `requests/[id]`, `settings`)
- **Admin**: `admin` (+ `catalog`, `email-analytics`, `products` actions, `users`)
- **About/marketing**: `about` (+ `careers`, `careers/[jobId]`, `contact`, `faq`,
  `privacy`)
- **Misc**: `debug`, `request`
- **API routes** (Route Handlers, ~35 total): activities, apply, auth (`[...nextauth]` —
  see bugs below, `register`, `verify`), categories, debug, email/send, invoices (+
  `[id]`, `[id]/download`, `[id]/preview`, `[id]/send-email`), notifications (+ `[id]`,
  `read-all`, `unread-count`), payments (`confirm`, `create-intent`,
  `create-setup-intent`, `intent`, `save-card`, `webhook`), pdf (`generate`, `upload`),
  products (+ `[productId]/delete`, `media`, `requests`, `status`; `media`,
  `media/[mediaId]`, `media/migrate`), requests (+ `[id]`, `[id]/user-delete`),
  `supplier/dashboard`, user (`addresses` + `[id]`, `profile`, `social-links` + `[id]`),
  `users`

## Stack

Supabase Auth (`@supabase/auth-helpers-nextjs`) for auth, Stripe for payments,
`pdfkit` + `@react-pdf/renderer` for invoice PDFs, Resend + React Email for email,
`@dnd-kit`/`@hello-pangea/dnd` for drag-and-drop, Chart.js/Recharts for reporting,
`react-hook-form` + `zod` for forms, Radix UI primitives, Framer Motion, Tailwind.

## Known bugs / dead code (found during the routing audit, not yet fixed)

- `src/app/api/auth/[...nextauth]/route.ts` — exists but has no real NextAuth config,
  just `export const runtime = 'edge'`. Does nothing. Real auth is Supabase, not
  NextAuth — this file is a leftover.
- `src/app/api/auth/middleware.ts` — looks like middleware but Next only loads
  `middleware.ts` at the project/`src` root; this nested file is never invoked. Dead.
- `src/app/metadata.ts` — unused (catalog-titled `metadata` export, not imported
  anywhere; the real root layout defines its own inline metadata).
- `src/app/components/dashboard/Sidebar.tsx:26` — `<img src="/logo.png">`; that file
  doesn't exist in `public/`.
- `src/services/emailQueueService.ts:170` — calls `fetch('/api/email/failed')`; no
  `route.ts` exists at that path.
- `src/app/components/about/Careers/JobCard.tsx:72` — links to
  `/about/careers/apply/${job.id}`; no `apply/[jobId]` route exists.
- `src/services/emailService.ts:151` — builds a verification link to `/verify?token=`;
  the actual route is `/verify-email`.
- `src/app/components/email/templates/BaseEmail.tsx:38` — references
  `/images/logo.png`; no `public/images/` directory exists.
- `next.config.js` → `images.domains` includes `'https://www.fayfort.com'` — should be
  a bare hostname (`www.fayfort.com`), not a full URL with protocol.
- No `.env`/`.env.local` in the repo (by design — env vars are supplied only at deploy
  time), so `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, Stripe/Supabase keys etc. all
  need to be set wherever this actually deploys before auth/payments/email will work
  locally.

## Recent change (today)

The ebook page (`src/app/page.tsx`, `src/app/components/ShopifyBuyButton.tsx`,
`src/app/globals.css`) was **copied** — not moved — into a new standalone project at
`../ebook`, as part of splitting `fayfort.com` into a hub (`/`) + `/ebook` + `/faysource`
via Next.js Multi-Zones. This `landed` project was **not modified** — the ebook still
sits at its `/` here too, now duplicated. That's fine for now (this project isn't part
of the current public routing), but worth resolving whenever you pick this back up:
either repurpose `/` here as the enterprise app's real entry point (e.g. redirect to
`/login` or `/dashboard`), or remove the now-duplicate ebook files once you're sure the
`ebook` project is the permanent home for it.

## Suggested next steps when you pick this up for the ERP

1. Decide what `/` should do in this app now that the ebook doesn't need to live here.
2. Clean up the dead code above (two fake middleware/auth files, unused metadata.ts) —
   low risk, removes noise before adding real ERP features on top.
3. Fix the `images.domains` config bug — likely already causing a build-time warning.
4. Wire up `/api/email/failed` or remove the code path that calls it.
5. Set up `.env.local` for local development (Stripe test keys, Supabase project,
   `NEXT_PUBLIC_APP_URL=http://localhost:3000`) so the dashboard/admin/auth flows are
   actually testable locally.
