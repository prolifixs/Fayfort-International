import type { Metadata } from 'next'
import Link from 'next/link'
import { LOOKUP_MESSAGES, type LookupMiss } from '@/lib/bookings'
import { PageHero } from '../../components'
import { FindBookingForm } from '../forms'

export const metadata: Metadata = {
  title: 'Schedule your consultation | FAYFORT International Trading',
  robots: { index: false, follow: false },
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? ''

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[]; email?: string | string[]; reason?: string | string[] }>
}) {
  const params = await searchParams
  const order = first(params.order).replace(/[^0-9#]/g, '').slice(0, 12)
  const email = first(params.email).slice(0, 254)
  // /book/open sends customers here, filled in, when the link from their email doesn't match.
  const reason = first(params.reason)
  const lookupError = reason in LOOKUP_MESSAGES ? LOOKUP_MESSAGES[reason as LookupMiss] : null

  return (
    <>
      <PageHero
        kicker="Video consultation"
        title={<>Pick a date for your <em>session.</em></>}
        lede="Enter the order number from your Shopify receipt and the email you paid with."
      />
      <div className="shell prose-page">
        <FindBookingForm defaultOrder={order} defaultEmail={email} initialError={lookupError} />
        <p className="booking-note booking-aside">
          Not booked yet? <Link className="text-link" href="/book">See the options and prices</Link>.
        </p>
      </div>
    </>
  )
}
