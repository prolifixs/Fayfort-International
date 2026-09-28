# Video consultations: booking with FayFay

Customers pay in the Shopify store, then suggest times on fayfort.com; FAYFORT confirms, holds and
completes each session in Fayfort Ops. Prices: **1 hour $100; 2 hours $160** ($80 an hour).

```
payment        booking               scheduling                 tracking                completion
Shopify   ->   paid         ->  proposed (customer)  ->  scheduled (FAYFORT)  ->  completed (FAYFORT)
                  \______________ cancelled (FAYFORT, or a refund in Shopify) _______/
```

| Step | Where | What happens |
| --- | --- | --- |
| Payment | fayfort.com/book, then Shopify checkout | The customer picks a length; the button puts that variant in the cart and goes to checkout. |
| Booking | automatic | A paid consultation order becomes a booking as soon as either side sees it: Fayfort Ops on its Bookings page, or fayfort.com when the customer looks it up. One order, one booking. |
| Scheduling | fayfort.com/book/schedule | The customer enters the order number and the email they paid with, and suggests 1 to 3 times in their own time zone (at least 24 hours ahead, within 60 days). |
| Confirmation | Fayfort Ops, Bookings | Staff pick one of the times, or another agreed with the customer, in China time, and add the meeting link. |
| Tracking | fayfort.com/book/&lt;private link&gt; | The customer's page shows each step, the confirmed time in their zone and in China, the call link and a Google Calendar link. |
| Completion | Fayfort Ops, Bookings | Staff mark it completed after the call, or cancel it. A refund or cancellation in Shopify cancels the booking automatically. |

Every step is recorded in `booking_events` with who did it; both sides show that timeline.

## Set up

### 1. The product in Shopify

The product is **Consultation** (handle **`consultation`**, product 11310952546646). Another handle
or title works if `CONSULTATION_PRODUCT_HANDLE` / `CONSULTATION_PRODUCT_TITLE` are set to them.
Each variant is one length, set up in Shopify as:

| Variant | Price |
| --- | --- |
| 1 | $100 |
| 2h+ | $160 |

- **The length is the first number in the variant's name** ("1" is 1 hour, "2h+" is 2 hours; "2 hours"
  would work too). A SKU like `CONSULT-2H` on a variant overrides the name, if one is ever added.
- Paid orders are recognised by the product title, *Consultation*, so renaming the product needs
  `CONSULTATION_PRODUCT_TITLE` set to the new title (or SKUs on the variants).
- Not a physical product (no shipping); don't track inventory.
- Available on the **Online Store** sales channel (the cart links and the price list use it).

fayfort.com/book reads the variants and prices from the product every five minutes, straight from
the real store, so its pay buttons are real checkout links. Until the product has variants on sale,
it shows the price list with "Opening soon" instead.

### 2. The order confirmation email

The store's **Order confirmation** email (Settings > Notifications > Customer notifications) is
one template for everything sold, kept in `docs/email/order-confirmation.liquid`. That file is
git-ignored because it holds the directory passwords: paste the whole file into Shopify.

- Consultation buyers get a "Pick your date" button to
  `https://www.fayfort.com/book/open?order=<number>&email=<email>`: it checks the pair with Shopify
  and opens their booking page on the date picker, in one click. If they don't match (say the email
  was changed), they land on the lookup form, filled in, with the reason.
- LANDED buyers get a note that the PDF comes from Shopify (it is a digital product) and the live
  directories with their passwords. Nobody else sees them.
- Neither section appears until the order is paid.
- Shopify's preview uses a sample order, so neither section shows there. Set `preview_as` at the
  top to `'landed'` or `'consultation'` to see one, then set it back to `''` and save: anything
  else sends that section to every customer.

### 3. Settings

fayfort.com (the LANDED Vercel project), all Sensitive, none `NEXT_PUBLIC_`:

| Variable | Value |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | A secret key of Supabase project `uswsmbhkedbehkotxngm` (Settings > API Keys). Bookings are reachable only with it. |
| `BOOKING_LINK_SECRET` | A long random string, **the same value as in Fayfort Ops**: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` | The same Dev Dashboard app Fayfort Ops uses (read_orders, read_customers). |
| `SHOPIFY_STORE_DOMAIN` | Optional; defaults to `8kjjz9-ei.myshopify.com`. |
| `CONSULTATION_PRODUCT_HANDLE` | Optional; defaults to `consultation`. |

Fayfort Ops: `LANDED_SUPABASE_URL`, `LANDED_SUPABASE_SECRET_KEY` (the same project), and
`BOOKING_LINK_SECRET` (the same value as above). See that repository's `.env.example`.

The tables and steps are in `supabase/schema.sql` (run it again after changing it; it is safe to
repeat).

## How it stays safe

- Customers don't sign in. A booking is theirs if they know both the order number and the email on
  the order; a wrong pair gets the same message either way and costs a second, so pairs can't be
  tried in bulk.
- After that, their page is `/book/<booking id>.<signature>`: an HMAC of the id with
  `BOOKING_LINK_SECRET`, so links can't be guessed or altered (an altered link shows "not found").
- `bookings` and `booking_events` have no access for the browser roles at all; both sites read and
  write them on the server with the secret key, through functions that allow only the next step
  (a customer can't confirm, complete or cancel; nobody can skip a step).
- Booking pages are `noindex`.

## Not included yet

- Emails from the system. Ops has "Email them" and "Email the confirmation" buttons that open a
  pre-written email with the customer's times and link; sending them automatically needs an email
  provider set up for fayfort.com.
- Changing or cancelling from the customer's page: they email support@fayfort.com, and staff move or
  cancel the session in Ops.
