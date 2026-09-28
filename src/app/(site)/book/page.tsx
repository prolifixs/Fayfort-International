import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORT_EMAIL } from '@/config/contact'
import { consultationOptions, LENGTHS, listPrice } from '@/lib/bookings'
import { PageHero, revealDelay } from '../components'
import { PricePicker } from './price-picker'

export const metadata: Metadata = {
  title: 'Book a video consultation | FAYFORT International Trading',
  description: 'An hour or two with FayFay on your sourcing: suppliers, costs, cities and buying trips. $100 for one hour, $160 for two.',
}

// Prices come from the Shopify product and are rechecked every five minutes.
export const revalidate = 300

const money = (amount: number) => `$${amount % 1 ? amount.toFixed(2) : amount}`

const covers = [
  'Which city makes your product, and why that matters',
  'Whether a supplier’s quote and claims hold up',
  'Your true landed cost: product, freight, duty, clearing',
  'Planning a buying trip to China that’s worth the flight',
]

const steps = [
  ['Pay in our shop.', 'Choose one hour or two. Checkout is through Shopify, like the LANDED book.'],
  ['Pick a date.', 'Your order email opens your booking page, where you pick a date and time in your own time zone.'],
  ['We confirm.', 'FAYFORT picks one, adds the video link, and your booking page shows it.'],
  ['Talk.', 'Join the call at the confirmed time. Your booking page tracks it from payment to done.'],
]

export default async function BookPage() {
  const options = await consultationOptions()
  const open = options.length > 0
  // Until the product is in the shop, show the published prices without a way to pay.
  const shown = open ? options : LENGTHS.map((hours) => ({ hours, price: listPrice(hours), cartUrl: null }))
  // The deal is worked out from the prices themselves, so it stays true if they change in Shopify.
  const hourly = shown.find((option) => option.hours === 1)?.price ?? listPrice(1)
  const two = shown.find((option) => option.hours === 2)
  const longRate = two ? two.price / 2 : hourly
  const discount = Math.round((1 - longRate / hourly) * 100)

  return (
    <>
      <PageHero
        kicker="Video consultation"
        title={<>An hour with FayFay, <em>on your sourcing.</em></>}
        lede="Eight years of buying, inspecting and shipping from China, applied to your product. On a video call, at a time that suits you."
      />

      <div className="shell prose-page">
        <section className="prose" data-reveal>
          <h2>What we can cover</h2>
          <ul>{covers.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section data-reveal style={revealDelay(1)}>
          <div className="price-heading">
            <h2 className="booking-heading">Choose how long</h2>
            {discount > 0 ? <p className="price-deal">Save {discount}% on two hours</p> : null}
          </div>
          <p className="booking-note">
            {money(hourly)} for one hour.{two ? ` Two hours are ${money(two.price)}${longRate < hourly ? `, ${money(longRate)} an hour` : ''}.` : ''}
          </p>
          <PricePicker options={shown} hourly={hourly} />
          {!open ? (
            <p className="booking-note">
              Online booking opens shortly. Until then, email <a className="text-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> to book.
            </p>
          ) : null}
        </section>
      </div>

      <section className="dark-section"><div className="shell section-space">
        <div className="section-kicker light" data-reveal><p>How it works</p></div>
        <ol className="steps">{steps.map(([title, copy], index) => <li key={title} data-reveal style={revealDelay(index)}><span>{index + 1}</span><strong>{title}</strong><p>{copy}</p></li>)}</ol>
      </div></section>

      <div className="shell prose-page">
        <section className="cta-panel" data-reveal="zoom">
          <h2>Already paid?</h2>
          <p>Use the button in your order email, or find your booking with your order number and email, and pick your date.</p>
          <div className="cta-actions">
            <Link className="button button-primary" href="/book/schedule">Pick my date <span aria-hidden>→</span></Link>
            <a className="text-button" href={`mailto:${SUPPORT_EMAIL}`}>Questions? {SUPPORT_EMAIL}</a>
          </div>
        </section>
      </div>
    </>
  )
}
