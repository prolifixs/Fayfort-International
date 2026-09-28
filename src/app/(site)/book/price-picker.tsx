'use client'

import { useState } from 'react'

export type PriceOption = { hours: number; price: number; cartUrl: string | null }

const money = (amount: number) => `$${amount % 1 ? amount.toFixed(2) : amount}`
const length = (hours: number) => (hours === 1 ? '1 hour' : `${hours} hours`)

/**
 * Pick a length on the left; the summary on the right shows the total, what it would cost at the
 * one-hour rate, and the pay button for that length. Two hours is selected to start with, since
 * that's where the discount begins.
 */
export function PricePicker({ options, hourly }: { options: PriceOption[]; hourly: number }) {
  const [hours, setHours] = useState(options.find((o) => o.hours === 2)?.hours ?? options[0]?.hours ?? 1)
  const chosen = options.find((o) => o.hours === hours) ?? options[0]
  if (!chosen) return null

  const full = hourly * chosen.hours
  const saving = Math.max(0, full - chosen.price)
  const rate = chosen.price / chosen.hours

  return (
    <div className="price-picker">
      <fieldset className="price-options">
        <legend className="sr-only">Session length</legend>
        {options.map((option) => {
          const optionSaving = Math.max(0, hourly * option.hours - option.price)
          return (
            <label key={option.hours} className={`price-option${option.hours === hours ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="hours"
                value={option.hours}
                checked={option.hours === hours}
                onChange={() => setHours(option.hours)}
              />
              <span className="price-option-length">{length(option.hours)}</span>
              <span className="price-option-rate">{money(option.price / option.hours)} an hour</span>
              {optionSaving > 0 ? <span className="price-option-save">Save {money(optionSaving)}</span> : null}
              <span className="price-option-total">{money(option.price)}</span>
            </label>
          )
        })}
      </fieldset>

      <aside className="price-summary" aria-live="polite">
        <p className="price-summary-label">Your session</p>
        <p className="price-summary-length">{length(chosen.hours)} with FayFay, on video</p>
        <p className="price-summary-total">
          {money(chosen.price)}
          {saving > 0 ? <s aria-label={`instead of ${money(full)}`}>{money(full)}</s> : null}
        </p>
        <p className="price-summary-detail">
          {money(rate)} an hour{saving > 0 ? ` · you save ${money(saving)}` : ''}
        </p>
        {chosen.cartUrl ? (
          <a className="button button-primary" href={chosen.cartUrl}>
            Pay {money(chosen.price)} and book <span aria-hidden>→</span>
          </a>
        ) : (
          <span className="button button-primary" aria-disabled="true">Opening soon</span>
        )}
        <p className="price-summary-note">Secure checkout through Shopify. Then suggest the times that suit you, and FAYFORT confirms one.</p>
      </aside>
    </div>
  )
}
