import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { SUPPORT_EMAIL } from '@/config/contact'
import { bookingForToken, FAYFORT_TIME_ZONE, type CustomerBooking } from '@/lib/bookings'
import { PageHero } from '../../components'
import { ProposeTimesForm } from '../forms'

export const metadata: Metadata = {
  title: 'Your consultation | FAYFORT International Trading',
  robots: { index: false, follow: false },
}

function zoneOrUtc(timeZone: string | null) {
  if (!timeZone) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return timeZone
  } catch {
    return 'UTC'
  }
}

const when = (iso: string, timeZone: string, hours?: number) => {
  const start = new Date(iso)
  const day = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(start)
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const range = hours ? `${clock.format(start)}–${clock.format(new Date(start.getTime() + hours * 3_600_000))}` : clock.format(start)
  return `${day}, ${range}`
}
const zoneLabel = (timeZone: string) =>
  timeZone === FAYFORT_TIME_ZONE ? 'China time' : timeZone === 'UTC' ? 'UTC' : `${timeZone.split('/').pop()!.replace(/_/g, ' ')} time`
const onDay = (iso: string | undefined, timeZone: string) =>
  iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone }).format(new Date(iso)) : null

// Google Calendar takes UTC times as 20300115T020000Z.
function calendarLink(booking: CustomerBooking) {
  if (!booking.start) return null
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const start = new Date(booking.start)
  const end = new Date(start.getTime() + booking.hours * 3_600_000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Video consultation with FayFay (FAYFORT)',
    dates: `${stamp(start)}/${stamp(end)}`,
    details: booking.meetingUrl ? `Join: ${booking.meetingUrl}` : '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

const ORDER: CustomerBooking['status'][] = ['paid', 'proposed', 'scheduled', 'completed']

function Tracker({ booking, zone }: { booking: CustomerBooking; zone: string }) {
  const reached = ORDER.indexOf(booking.status)
  const steps: { key: CustomerBooking['status']; title: string; waiting: string }[] = [
    { key: 'paid', title: 'Paid', waiting: '' },
    { key: 'proposed', title: 'Date picked', waiting: 'Pick a date below.' },
    { key: 'scheduled', title: 'Confirmed', waiting: 'FAYFORT is confirming your time.' },
    { key: 'completed', title: 'Session held', waiting: 'See you on the call.' },
  ]
  return (
    <ol className="booking-track">
      {steps.map((step, index) => {
        const done = booking.status !== 'cancelled' && index <= reached
        const current = booking.status !== 'cancelled' && index === reached + 1
        const date = onDay(booking.steps[step.key], zone)
        return (
          <li key={step.key} className={done ? 'is-done' : current ? 'is-current' : undefined}>
            <strong>{step.title}</strong>
            {done && date ? <p>{date}</p> : current && step.waiting ? <p>{step.waiting}</p> : null}
          </li>
        )
      })}
    </ol>
  )
}

export default async function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  await connection()
  const { token } = await params

  let booking: CustomerBooking | null
  try {
    booking = await bookingForToken(token)
  } catch (error) {
    console.error('Booking page failed:', error instanceof Error ? error.message : error)
    return (
      <>
        <PageHero kicker="Video consultation" title="Your booking" />
        <div className="shell prose-page">
          <p className="booking-error">
            Your booking can’t be shown right now. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your order number and we’ll help.
          </p>
        </div>
      </>
    )
  }
  if (!booking) notFound()

  const zone = zoneOrUtc(booking.timeZone)
  const hours = booking.hours === 1 ? '1 hour' : `${booking.hours} hours`
  const calendar = calendarLink(booking)

  return (
    <>
      <PageHero
        kicker={`Order ${booking.orderName}`}
        title={<>Your video <em>consultation.</em></>}
        lede={`${hours} with FayFay${booking.name ? `, for ${booking.name}` : ''}. Keep this page: it follows your booking from payment to the call.`}
      />

      <div className="shell prose-page booking-page">
        <Tracker booking={booking} zone={zone} />

        {booking.status === 'cancelled' ? (
          <section className="prose">
            <h2>This session was cancelled</h2>
            <p>{booking.cancelNote && booking.cancelNote !== 'Cancelled' ? `${booking.cancelNote}. ` : ''}Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
          </section>
        ) : booking.status === 'scheduled' && booking.start ? (
          <section className="booking-confirmed">
            <p className="mini-label">Confirmed</p>
            <p className="booking-when">{when(booking.start, zone, booking.hours)}</p>
            <p className="booking-note">
              {zoneLabel(zone)}. In China: {when(booking.start, FAYFORT_TIME_ZONE, booking.hours)}.
            </p>
            <div className="cta-actions">
              {booking.meetingUrl ? (
                <a className="button button-primary" href={booking.meetingUrl} target="_blank" rel="noreferrer">
                  Join the call <span aria-hidden>→</span>
                </a>
              ) : null}
              {calendar ? <a className="text-button" href={calendar} target="_blank" rel="noreferrer">Add to Google Calendar</a> : null}
            </div>
            <p className="booking-note">
              Need to move it? Email <a className="text-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your order number.
            </p>
          </section>
        ) : booking.status === 'completed' ? (
          <section className="prose">
            <h2>Thank you for the session</h2>
            <p>
              If you want help acting on it, sourcing, inspection and shipping are <Link href="/services">what FAYFORT does</Link>.
            </p>
          </section>
        ) : (
          <section>
            <h2 className="booking-heading">{booking.status === 'proposed' ? 'Your picked dates' : 'Pick your date'}</h2>
            {booking.status === 'proposed' ? (
              <ul className="booking-proposed">
                {booking.proposedTimes.map((time) => (
                  <li key={time}>{when(time, zone, booking.hours)} <span>({zoneLabel(zone)})</span></li>
                ))}
              </ul>
            ) : null}
            <ProposeTimesForm token={token} existing={booking.proposedTimes} notes={booking.notes} />
          </section>
        )}
      </div>
    </>
  )
}
