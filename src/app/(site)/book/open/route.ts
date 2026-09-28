import { NextResponse, type NextRequest } from 'next/server'
import { findBooking } from '@/lib/bookings'

export const dynamic = 'force-dynamic'

/**
 * The "Pick your date" button in the order confirmation email (docs/BOOKINGS.md): checks the order
 * number and email with Shopify and sends the customer straight to their booking page. A miss lands
 * on the lookup form, filled in, with the reason; like the form, each miss costs a second.
 */
export async function GET(request: NextRequest) {
  const order = (request.nextUrl.searchParams.get('order') ?? '').slice(0, 20)
  const email = (request.nextUrl.searchParams.get('email') ?? '').slice(0, 254)

  const result = await findBooking(order, email)
  if (result.ok) return NextResponse.redirect(new URL(`/book/${result.token}`, request.url), 303)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  const form = new URL('/book/schedule', request.url)
  if (order) form.searchParams.set('order', order)
  if (email) form.searchParams.set('email', email)
  form.searchParams.set('reason', result.reason)
  return NextResponse.redirect(form, 303)
}
