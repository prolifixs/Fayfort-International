'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { findBooking, proposeTimes } from '@/lib/bookings'

export type FormState = { ok: boolean; message: string } | null

/** Order number and email in, the customer's private booking page out. */
export async function findBookingAction(_previous: FormState, form: FormData): Promise<FormState> {
  const result = await findBooking(String(form.get('order') ?? ''), String(form.get('email') ?? ''))
  if (!result.ok) {
    // Each miss costs a second, so order numbers and emails can't be tried in bulk.
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { ok: false, message: result.message }
  }
  redirect(`/book/${result.token}`)
}

/** The date the customer picked (and any back-up choices), already converted to UTC in their browser. */
export async function proposeTimesAction(_previous: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get('token') ?? '')
  const times = form.getAll('times').map(String).filter(Boolean).slice(0, 3)
  const timeZone = String(form.get('timeZone') ?? '').slice(0, 64) || null
  const notes = String(form.get('notes') ?? '').slice(0, 2000)

  const result = await proposeTimes(token, times, timeZone, notes)
  if (!result.ok) return { ok: false, message: result.message }
  revalidatePath(`/book/${token}`)
  return { ok: true, message: 'Thanks. FAYFORT will confirm your time and send you the video link.' }
}
