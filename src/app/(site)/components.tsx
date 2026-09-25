import type { CSSProperties, ReactNode } from 'react'

// Staggers [data-reveal] elements: step 0 appears first, each later step 90ms after.
export function revealDelay(step: number, ms = 90): CSSProperties {
  return { '--reveal-delay': `${step * ms}ms` } as CSSProperties
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
