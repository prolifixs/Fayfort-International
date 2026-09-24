import type { ReactNode } from 'react'

// Marks a value that still has to be decided before the page is final.
export function Tbc({ children }: { children: ReactNode }) {
  return <mark className="tbc" title="To be confirmed before publishing">{children}</mark>
}

export function DraftBanner() {
  return (
    <aside className="draft-banner" role="note">
      <strong>Draft — not yet legally reviewed</strong>
      <span>These terms are being finalised. Highlighted items are still to be confirmed.</span>
    </aside>
  )
}

export function PageHero({ kicker, title, lede }: { kicker: string; title: ReactNode; lede?: ReactNode }) {
  return (
    <section className="page-hero"><div className="shell">
      <p className="overline"><span /> {kicker}</p>
      <h1>{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
    </div></section>
  )
}
