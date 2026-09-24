import type { CSSProperties, ReactNode } from 'react'

// Staggers [data-reveal] elements: step 0 appears first, each later step 90ms after.
export function revealDelay(step: number, ms = 90): CSSProperties {
  return { '--reveal-delay': `${step * ms}ms` } as CSSProperties
}

// Marks a value that still has to be decided before the page is final.
export function Tbc({ children }: { children: ReactNode }) {
  return <mark className="tbc" title="To be confirmed before publishing">{children}</mark>
}

export function DraftBanner() {
  return (
    <aside className="draft-banner" role="note" data-reveal="fade">
      <strong>Draft — not yet legally reviewed</strong>
      <span>These terms are being finalised. Highlighted items are still to be confirmed.</span>
    </aside>
  )
}

export function PageHero({ kicker, title, lede }: { kicker: string; title: ReactNode; lede?: ReactNode }) {
  return (
    <section className="page-hero"><div className="shell">
      <p className="overline" data-reveal><span /> {kicker}</p>
      <h1 data-reveal style={revealDelay(1)}>{title}</h1>
      {lede && <p className="page-lede" data-reveal style={revealDelay(2)}>{lede}</p>}
    </div></section>
  )
}
