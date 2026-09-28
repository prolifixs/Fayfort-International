'use client'

import { useActionState, useState, useSyncExternalStore } from 'react'
import { findBookingAction, proposeTimesAction, type FormState } from './actions'

const MAX_TIMES = 3
const CHOICES = ['First', 'Second', 'Third']
const DAY_MS = 86_400_000
const QUARTER_HOUR_MS = 900_000

function Message({ state }: { state: FormState }) {
  if (!state) return null
  return (
    <p role="status" className={state.ok ? 'booking-success' : 'booking-error'}>
      {state.message}
    </p>
  )
}

export function FindBookingForm({
  defaultOrder,
  defaultEmail = '',
  initialError = null,
}: {
  defaultOrder: string
  defaultEmail?: string
  /** Why the link from the confirmation email didn't open a booking, if it didn't. */
  initialError?: string | null
}) {
  const [state, action, pending] = useActionState(findBookingAction, initialError ? { ok: false, message: initialError } : null)
  return (
    <form action={action} className="booking-form">
      <label className="booking-field">
        <span>Order number</span>
        <input name="order" required inputMode="numeric" autoComplete="off" placeholder="#1005" defaultValue={defaultOrder} />
        <small>On your Shopify receipt, next to “Order”.</small>
      </label>
      <label className="booking-field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="The one you paid with" defaultValue={defaultEmail} />
      </label>
      <Message state={state} />
      <div>
        <button type="submit" className="button button-primary" disabled={pending} aria-busy={pending}>
          {pending ? 'Finding your booking…' : 'Find my booking'} <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  )
}

// datetime-local works in the browser's own time: "2030-01-15T09:30" means 09:30 where they are.
const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
const chinaTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// The browser's time zone: null while rendering on the server, the real zone once in the browser.
const noSubscription = () => () => {}
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const serverZone = () => null

/**
 * Up to three times that suit the customer, in their own time zone. The form only appears once it
 * knows that zone (in the browser), and sends each time as UTC together with the zone's name.
 */
export function ProposeTimesForm(props: { token: string; existing: string[]; notes: string | null }) {
  const zone = useSyncExternalStore(noSubscription, browserZone, serverZone)
  if (!zone) return <p className="booking-note">Loading your time zone…</p>
  return <TimesForm {...props} zone={zone} />
}

// Only ever rendered in the browser, so its starting values can use the local clock directly.
function TimesForm({ token, existing, notes, zone }: { token: string; existing: string[]; notes: string | null; zone: string }) {
  const [state, action, pending] = useActionState(proposeTimesAction, null)
  const [times, setTimes] = useState(() => (existing.length ? existing.map((iso) => toLocalInput(new Date(iso))) : ['']))
  // The picker steps in quarter hours counted from `min`, so min itself has to sit on a quarter
  // hour: from 21:41, 09:00 would be refused as "not a valid value".
  const [min] = useState(() => toLocalInput(new Date(Math.ceil((Date.now() + DAY_MS) / QUARTER_HOUR_MS) * QUARTER_HOUR_MS)))

  const submit = (form: FormData) => {
    const out = new FormData()
    out.set('token', token)
    out.set('timeZone', zone)
    out.set('notes', String(form.get('notes') ?? ''))
    for (const value of times.filter(Boolean)) out.append('times', new Date(value).toISOString())
    action(out)
  }

  return (
    <form action={submit} className="booking-form">
      <p className="booking-note">
        Pick a date and time in your own time zone ({zone.replace(/_/g, ' ')}), at least a day ahead. Add a second or third
        choice in case the first is taken. FayFay is in China (UTC+8); each choice shows what that is there.
      </p>
      <div className="booking-times">
        {times.map((value, index) => (
          <div className="booking-field" key={index}>
            <span>{CHOICES[index]} choice</span>
            <div className="booking-time-row">
              <input
                type="datetime-local"
                required={index === 0}
                min={min}
                step={900}
                value={value}
                onChange={(event) => setTimes((all) => all.map((t, i) => (i === index ? event.target.value : t)))}
                aria-label={`${CHOICES[index]} choice, your time`}
              />
              {times.length > 1 ? (
                <button type="button" className="text-button" onClick={() => setTimes((all) => all.filter((_, i) => i !== index))}>
                  Remove
                </button>
              ) : null}
            </div>
            {value ? <small>{chinaTime.format(new Date(value))} in China</small> : null}
          </div>
        ))}
      </div>
      {times.length < MAX_TIMES ? (
        <div>
          <button type="button" className="text-button" onClick={() => setTimes((all) => [...all, ''])}>
            Add another choice
          </button>
        </div>
      ) : null}
      <label className="booking-field">
        <span>What would you like to cover? (optional)</span>
        <textarea name="notes" maxLength={2000} defaultValue={notes ?? ''} placeholder="The product, where you are with suppliers, what you want to decide." />
      </label>
      <Message state={state} />
      <div>
        <button type="submit" className="button button-primary" disabled={pending} aria-busy={pending}>
          {pending ? 'Sending…' : existing.length ? 'Update my date' : 'Book this date'} <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  )
}
