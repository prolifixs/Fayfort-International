import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/supabase/config'
import { adminQuery, shopDomain, ShopifyUnavailable } from './shopify'

// Video consultations with FayFay. The customer pays in the Shopify store, then finds their booking
// here with the order number and the email they paid with, suggests times, and follows it through
// to the session. Bookings live in Supabase (supabase/schema.sql), where only the secret key
// reaches them and functions allow only the next step. FAYFORT confirms and completes sessions
// in Fayfort Ops.

export const FAYFORT_TIME_ZONE = 'Asia/Shanghai'
// The product in the FAYFORT store (shop URL /products/consultation, id 11310952546646).
export const PRODUCT_HANDLE = process.env.CONSULTATION_PRODUCT_HANDLE?.trim() || 'consultation'
const PRODUCT_TITLE = (process.env.CONSULTATION_PRODUCT_TITLE?.trim() || 'Consultation').toLowerCase()
const CONSULT_SKU = /^CONSULT-(\d+)H$/i

/**
 * How many hours a variant of the product is: from a SKU like CONSULT-2H when it has one, otherwise
 * the first number in its name ("1", "2h+", "2 hours").
 */
function hoursOf(sku: string | null | undefined, variantTitle: string | null | undefined) {
  const bySku = CONSULT_SKU.exec(sku ?? '')
  if (bySku) return Number(bySku[1])
  const byName = /(\d+)/.exec(variantTitle ?? '')
  return byName ? Number(byName[1]) : 1
}

/** An order line is a consultation when it has a consultation SKU or is the Consultation product. */
const isConsultation = (line: { sku: string | null; title: string }) =>
  CONSULT_SKU.test(line.sku ?? '') || (line.title ?? '').trim().toLowerCase() === PRODUCT_TITLE
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The published price list: $100 for one hour, $160 for two. Shopify's prices are what's charged. */
export const LENGTHS = [1, 2]
export const listPrice = (hours: number) => (hours === 1 ? 100 : 80 * hours)

export type BookingStatus = 'paid' | 'proposed' | 'scheduled' | 'completed' | 'cancelled'

export type CustomerBooking = {
  id: string
  orderName: string
  name: string | null
  hours: number
  amount: number
  currency: string
  status: BookingStatus
  timeZone: string | null
  proposedTimes: string[]
  notes: string | null
  start: string | null
  meetingUrl: string | null
  paidAt: string
  completedAt: string | null
  cancelledAt: string | null
  /** When each step happened, for the tracker. */
  steps: Partial<Record<BookingStatus, string>>
  cancelNote: string | null
}

export type Found = { ok: true; token: string } | { ok: false; reason: LookupMiss; message: string }
export type Saved = { ok: true } | { ok: false; message: string }

class BookingSetupMissing extends Error {}

function database() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) throw new BookingSetupMissing('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// The private link: the booking id and an HMAC of it. Fayfort Ops signs links the same way with
// the same BOOKING_LINK_SECRET, so staff can send customers their page.
function signature(id: string) {
  const secret = process.env.BOOKING_LINK_SECRET?.trim()
  if (!secret) throw new BookingSetupMissing('BOOKING_LINK_SECRET is not set')
  return createHmac('sha256', secret).update(`booking:${id}`).digest('base64url').slice(0, 22)
}

export const bookingToken = (id: string) => `${id}.${signature(id)}`

/** The booking id a link's token stands for, or null when the token isn't one we signed. */
export function idFromToken(token: string) {
  const [id, given] = decodeURIComponent(token).split('.')
  if (!UUID.test(id ?? '') || !given) return null
  const expected = signature(id)
  if (given.length !== expected.length) return null
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected)) ? id : null
}

export type ConsultationOption = { hours: number; price: number; cartUrl: string }

/**
 * What can be booked, straight from the Shopify product: one option per variant on sale, its length
 * from hoursOf(), with a link that puts it in the cart and goes to checkout. Empty when the product
 * doesn't exist yet. Always the real store (never the test stand-in): the feed is public, and the
 * pay links have to be real checkout links.
 */
export async function consultationOptions(): Promise<ConsultationOption[]> {
  try {
    const response = await fetch(`https://${shopDomain()}/products/${PRODUCT_HANDLE}.js`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return []
    const product = (await response.json()) as {
      variants: { id: number; title: string; sku: string | null; price: number; available: boolean }[]
    }
    const byHours = new Map<number, ConsultationOption>()
    for (const variant of product.variants) {
      const hours = hoursOf(variant.sku, variant.title)
      if (!variant.available || hours < 1 || hours > 24 || byHours.has(hours)) continue
      byHours.set(hours, { hours, price: variant.price / 100, cartUrl: `https://${shopDomain()}/cart/${variant.id}:1` })
    }
    return [...byHours.values()].sort((a, b) => a.hours - b.hours)
  } catch {
    return []
  }
}

// Validated against Admin GraphQL 2026-07. Needs read_orders (read_customers for the name).
const ORDER_QUERY = /* GraphQL */ `
  query FayfortBookingOrder($query: String!) {
    orders(first: 5, query: $query) {
      nodes {
        id
        name
        email
        processedAt
        cancelledAt
        displayFinancialStatus
        customer {
          displayName
        }
        lineItems(first: 20) {
          nodes {
            title
            variantTitle
            sku
            quantity
            discountedTotalSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`

type OrderNode = {
  id: string
  name: string
  email: string | null
  processedAt: string
  cancelledAt: string | null
  displayFinancialStatus: string | null
  customer: { displayName: string } | null
  lineItems: {
    nodes: {
      title: string
      variantTitle: string | null
      sku: string | null
      quantity: number
      discountedTotalSet: { shopMoney: { amount: string; currencyCode: string } }
    }[]
  }
}

/** Why a lookup found no booking to open; the same wording wherever it's shown. */
export const LOOKUP_MESSAGES = {
  'not-found': "We couldn't find a paid consultation with that order number and email. Check both against your Shopify receipt.",
  cancelled: 'That order was cancelled or refunded, so there is no session to schedule.',
  unpaid: 'We haven’t received the payment for that order yet. Try again once Shopify confirms it.',
  unavailable: 'Booking lookup isn’t available right now. Email support@fayfort.com with your order number and we’ll sort it out.',
} as const
export type LookupMiss = keyof typeof LOOKUP_MESSAGES
const miss = (reason: LookupMiss) => ({ ok: false as const, reason, message: LOOKUP_MESSAGES[reason] })

/**
 * Finds the booking for a paid consultation order, creating it on first use, and returns the token
 * for its private page. The order number and email must both match; the same message is given
 * whichever is wrong, so it can't be used to test addresses.
 */
export async function findBooking(orderInput: string, emailInput: string): Promise<Found> {
  const number = orderInput.replace(/[^0-9]/g, '').slice(0, 12)
  const email = emailInput.trim().toLowerCase()
  if (!number || !/^[^\s@]+@[^\s@]+$/.test(email)) return miss('not-found')

  try {
    const data = await adminQuery<{ orders: { nodes: OrderNode[] } }>(ORDER_QUERY, { query: `name:#${number}` })
    const order = data.orders.nodes.find((o) => o.name.replace(/[^0-9]/g, '') === number)
    if (!order || order.email?.trim().toLowerCase() !== email) return miss('not-found')

    let hours = 0
    let amount = 0
    let currency = 'USD'
    for (const line of order.lineItems.nodes) {
      if (!isConsultation(line)) continue
      hours += hoursOf(line.sku, line.variantTitle) * line.quantity
      amount += Number(line.discountedTotalSet.shopMoney.amount) || 0
      currency = line.discountedTotalSet.shopMoney.currencyCode
    }
    if (hours === 0) return miss('not-found')

    const status = order.displayFinancialStatus ?? ''
    if (order.cancelledAt || status === 'REFUNDED' || status === 'VOIDED') {
      return miss('cancelled')
    }
    if (status !== 'PAID' && status !== 'PARTIALLY_REFUNDED') {
      return miss('unpaid')
    }

    const { data: booking, error } = await database().rpc('booking_record_paid', {
      p_order_id: order.id,
      p_order_name: order.name,
      p_email: order.email,
      p_name: order.customer?.displayName ?? null,
      p_hours: hours,
      p_amount: amount,
      p_currency: currency,
      p_paid_at: order.processedAt,
    })
    if (error || !booking) throw new Error(error?.message ?? 'No booking returned')
    return { ok: true, token: bookingToken((booking as { id: string }).id) }
  } catch (error) {
    if (!(error instanceof ShopifyUnavailable || error instanceof BookingSetupMissing)) console.error('Booking lookup failed:', error)
    else console.error('Booking lookup unavailable:', error.message)
    return miss('unavailable')
  }
}

type Row = {
  id: string
  order_name: string
  customer_name: string | null
  hours: number
  amount: number | string
  currency: string
  status: BookingStatus
  customer_timezone: string | null
  proposed_times: string[] | null
  customer_notes: string | null
  scheduled_start: string | null
  meeting_url: string | null
  paid_at: string
  completed_at: string | null
  cancelled_at: string | null
  events: { id: number; status: BookingStatus; note: string | null; created_at: string }[] | null
}

/** The booking a private link points to, or null for a link that isn't valid. */
export async function bookingForToken(token: string): Promise<CustomerBooking | null> {
  const id = idFromToken(token)
  if (!id) return null
  const { data, error } = await database()
    .from('bookings')
    .select(
      'id, order_name, customer_name, hours, amount, currency, status, customer_timezone, proposed_times, customer_notes, scheduled_start, meeting_url, paid_at, completed_at, cancelled_at, events:booking_events(id, status, note, created_at)'
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`Could not load booking: ${error.message}`)
  if (!data) return null

  const row = data as unknown as Row
  const events = (row.events ?? []).sort((a, b) => a.id - b.id)
  const steps: CustomerBooking['steps'] = {}
  for (const event of events) steps[event.status] ??= event.created_at
  return {
    id: row.id,
    orderName: row.order_name,
    name: row.customer_name,
    hours: row.hours,
    amount: Number(row.amount) || 0,
    currency: row.currency,
    status: row.status,
    timeZone: row.customer_timezone,
    proposedTimes: row.proposed_times ?? [],
    notes: row.customer_notes,
    start: row.scheduled_start,
    meetingUrl: row.meeting_url,
    paidAt: row.paid_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    steps,
    cancelNote: [...events].reverse().find((e) => e.status === 'cancelled')?.note ?? null,
  }
}

/** Saves the customer's suggested times; the database checks the rules and says what's wrong. */
export async function proposeTimes(token: string, times: string[], timeZone: string | null, notes: string): Promise<Saved> {
  const id = idFromToken(token)
  if (!id) return { ok: false, message: 'This booking link isn’t valid.' }
  const iso = times.map((time) => new Date(time)).filter((date) => !Number.isNaN(date.getTime())).map((date) => date.toISOString())
  if (iso.length !== times.length || iso.length === 0) return { ok: false, message: 'Choose a date and time for each option.' }

  const { error } = await database().rpc('booking_propose', {
    p_id: id,
    p_times: iso,
    p_timezone: timeZone,
    p_notes: notes,
  })
  return error ? { ok: false, message: error.message } : { ok: true }
}
