'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight, BedDouble, Check, ChevronLeft, ChevronRight, ClipboardCheck, Factory, MapPin, PackageSearch, RotateCcw, SearchCheck, ShieldCheck, Store, Truck, UtensilsCrossed, X, type LucideIcon } from 'lucide-react'
import { CHECKOUT_URL, INSTAGRAM_HANDLE, PRICE_USD, PRICE_WAS_USD, REFUND_ANSWER, SOURCING_ENQUIRY_URL, SUPPORT_EMAIL, formatPrice } from './config'

const failures = [
  {
    title: 'Everyone reads the same page.',
    copy: 'Whatever you found, your competitor found. The markets you can find in ten minutes are the markets everyone finds in ten minutes, and the prices reflect it.',
  },
  {
    title: 'The information contradicts itself.',
    copy: 'While assembling this directory we checked hardware markets across several well-ranked sources. One gave an address on Heliu Street. Another gave 228 Sanyuanli Avenue. A third gave 78 on the same avenue. Same category, same city, three answers.',
  },
  {
    title: 'The lists are thin where it matters.',
    copy: 'A buyer we know paid for a market list, flew out, and went straight to the section on denim. It named two markets. Neither had what she wanted. She eventually found the right one — a market that was not in the list at all, because the person who sold it had never lived here.',
  },
]

const inside = [
  {
    icon: ClipboardCheck,
    title: 'How buying here actually works',
    copy: 'Nine short chapters. Foreigner price and how to stop paying it. Why you never buy off-category. Which floor, which building. The three questions to ask before you discuss anything else. How not to sound like a first-timer. Don’t let the factory arrange your freight, share the container, pay in RMB.',
  },
  {
    icon: Store,
    title: 'The Guangzhou directory',
    copy: 'Twenty-eight categories, organised by corridor rather than by district — because Guangzhou’s wholesale trade runs along roads, not neighbourhoods. Apparel, fabrics, footwear, leather, watches, eyewear, jewellery, hair, cosmetics, furniture, lighting, stone, kitchenware, appliances, solar, phone accessories, auto parts, toys, stationery, packaging, fishing, tea.',
  },
  {
    icon: Factory,
    title: 'Beyond Guangzhou',
    copy: 'The cluster towns, where the things are actually made. Foshan for furniture and ceramics. Guzhen for lighting. Shenzhen for electronics. Dongguan for plastics and hardware. Shantou for toys. Jiangmen for steel. Shaoxing for fabric. Yiwu for small commodities. Qingdao for hair.',
  },
]

const directoryFeatures = [
  'Every entry with its current address, in English and Chinese',
  'Floor and stall detail where we have it',
  'The compilation date on every single entry',
  'New entries added as they are verified',
  'Corrections logged and dated',
  'Searchable by category, city and corridor',
]

const included = [
  'LANDED, in PDF, delivered instantly',
  'Full live market and factory directory, continuously updated',
  'Hotel directory: budget to upscale, near the fair and the markets',
  'Restaurant directory: West African, halal and international',
  'Services directory: freight forwarders, cargo consolidators, customs brokers, interpreters and inspection',
  'New entries as they are verified, corrections logged with dates',
]

const faqs: [string, ReactNode][] = [
  ['Is this a physical book?', 'No. You get the PDF and EPUB immediately, plus access to the live directory. A paperback is coming.'],
  ['What does “live directory” actually mean?', 'A web-based version of the address list that gets corrected and added to continuously. Every entry carries the date it was compiled and its verification status. The book is a snapshot of it.'],
  ['Do I need to speak Chinese?', 'No. Every entry we have carries the address in Chinese characters. Screenshot it and show it to your driver — that is the single most practical thing in the directory.'],
  ['How current is it?', 'Directory data compiled to 15 August 2026, and updated continuously after that. Every entry shows its own date. Anything older than a year should be treated as a strong lead rather than a fact, and the directory tells you which is which.'],
  ['Are the addresses guaranteed?', 'No, and we say so throughout. Markets move and stalls change hands. Confirm before you travel — never book a flight or commit money on the strength of an entry without checking it. Where we could not confirm something, the entry says so.'],
  ['Can I share my access with my business partner?', 'No. Access is issued to one named person and is monitored. Shared credentials are withdrawn without refund. Your partner needs their own.'],
  ...(REFUND_ANSWER ? [['Can I get a refund?', REFUND_ANSWER] as [string, ReactNode]] : []),
  ['Do you source for people?', <>Yes. That is the main business. A directory will tell you where to go; it will not go for you. If you want someone on the ground, <a href={SOURCING_ENQUIRY_URL}>tell us what you need</a>.</>],
]

type SampleEntry = {
  kind: string
  icon: LucideIcon
  name: string
  nameZh?: string
  addressZh?: string
  address: string
  details: [string, string][]
  note?: string
  verified?: boolean
}

// One real entry from each directory table. Personal phone numbers and contact names stay behind the paywall.
const sampleEntries: SampleEntry[] = [
  {
    kind: 'Market',
    icon: Store,
    name: 'Guangda Leather Clothing City',
    addressZh: '广州白云区石井街道庆槎路901号',
    address: 'No. 901 Qingcha Road, Shijing, Baiyun District, Guangzhou',
    details: [['Category', 'Stocklot & Factory Clearance'], ['Type', 'Market, traders'], ['MOQ note', 'As low as 10 pieces'], ['Compiled', '15 Aug 2026']],
    verified: true,
  },
  {
    kind: 'Hotel',
    icon: BedDouble,
    name: 'Estay Residence',
    address: 'No. 1020 Xingang Dong Rd, Haizhu, behind Poly World Trade Centre, Block D',
    details: [['Area', 'Pazhou / Canton Fair'], ['Price', 'Budget'], ['Style', 'Apartment-style, walkable to the fair']],
    note: 'Reviews warn the map pin is wrong and taxi drivers drop at the wrong spot. Show Block D, Poly World Trade Centre.',
  },
  {
    kind: 'Restaurant',
    icon: UtensilsCrossed,
    name: 'Sadda Restaurant',
    nameZh: '萨德餐厅',
    address: 'Jinying Building 1F, 316 Huanshi Zhong Rd, Yuexiu',
    details: [['Area', 'Xiaobei'], ['Cuisine', 'Halal / Middle Eastern (Yemeni)'], ['Halal', 'Yes'], ['Hours', '10:00–22:00 daily']],
    note: 'Mandi and haneeth are the dishes reviewers name. Shisha at the entrance; one reviewer found the room chaotic.',
  },
  {
    kind: 'Service',
    icon: Truck,
    name: 'MCO KOKO Cargo',
    address: 'Guangzhou',
    details: [['Type', 'Cargo consolidator (air, Ethiopian)'], ['Hours', '15:00–23:00'], ['Contact', 'Manager on WhatsApp, reachable from Africa']],
    note: 'Opens at 3pm and works to 11pm, evening hours to match African time zones. Do not go in the morning.',
  },
]

const SLIDE_GAP = 16 // keep in sync with .carousel-track gap

function DirectoryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()

  const goTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(sampleEntries.length - 1, index))
    const width = (track.children[0] as HTMLElement | undefined)?.offsetWidth ?? 0
    track.scrollTo({ left: clamped * (width + SLIDE_GAP), behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = (track.children[0] as HTMLElement | undefined)?.offsetWidth || 1
        setActive(Math.round(track.scrollLeft / (width + SLIDE_GAP)))
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => { track.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])

  return (
    <div className="directory-carousel" role="region" aria-roledescription="carousel" aria-label="Sample directory entries">
      <div className="carousel-head">
        <div className="carousel-tabs" role="group" aria-label="Jump to directory">
          {sampleEntries.map(({ kind, icon: Icon }, index) => (
            <button key={kind} type="button" aria-pressed={active === index} onClick={() => goTo(index)}><Icon size={13} aria-hidden="true" />{kind}</button>
          ))}
        </div>
        <div className="carousel-arrows">
          <button type="button" aria-label="Previous entry" onClick={() => goTo(active - 1)} disabled={active === 0}><ChevronLeft size={16} /></button>
          <button type="button" aria-label="Next entry" onClick={() => goTo(active + 1)} disabled={active === sampleEntries.length - 1}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="carousel-track" ref={trackRef}>
        {sampleEntries.map((entry, index) => (
          <article className="directory-card carousel-slide" key={entry.name} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${sampleEntries.length}: ${entry.kind}`}>
            <div className="directory-card-bar">
              <span><SearchCheck size={14} /> FaySource · {entry.kind} directory</span>
              {entry.verified ? <span className="entry-status"><i /> Verified</span> : <span className="entry-kind"><entry.icon size={12} aria-hidden="true" /> {entry.kind}</span>}
            </div>
            <div className="directory-card-body">
              <h3>{entry.name}{entry.nameZh && <span lang="zh-CN">{entry.nameZh}</span>}</h3>
              {entry.addressZh && <p className="entry-zh" lang="zh-CN">{entry.addressZh}</p>}
              <p className="entry-en"><MapPin size={13} aria-hidden="true" /> {entry.address}</p>
              <dl>{entry.details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              {entry.note && <p className="entry-note"><strong>Field note</strong>{entry.note}</p>}
            </div>
          </article>
        ))}
      </div>
      <div className="carousel-dots" aria-hidden="true">{sampleEntries.map(({ kind }, index) => <i key={kind} className={active === index ? 'is-active' : undefined} />)}</div>
    </div>
  )
}

function CardPattern({ type }: { type: 'current' | 'factory' | 'independent' }) {
  const patterns = {
    current: [SearchCheck, MapPin, PackageSearch, SearchCheck, MapPin, PackageSearch, SearchCheck, MapPin, PackageSearch],
    factory: [Factory, Store, PackageSearch, Factory, Store, PackageSearch, Factory, Store, PackageSearch],
    independent: [ShieldCheck, SearchCheck, ClipboardCheck, ShieldCheck, SearchCheck, ClipboardCheck, ShieldCheck, SearchCheck, ClipboardCheck],
  }
  return <div className={`card-icon-pattern pattern-${type}`} aria-hidden="true">{patterns[type].map((Icon, index) => <Icon key={index} />)}</div>
}

export default function LandedPage() {
  const heroRef = useRef<HTMLElement>(null)
  const purchaseRef = useRef<HTMLElement>(null)
  const [showMobileCta, setShowMobileCta] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const rawBookY = useTransform(heroProgress, [0, 1], [0, reduceMotion ? 0 : -145])
  const rawBookRotate = useTransform(heroProgress, [0, 1], [-3, reduceMotion ? -3 : 9])
  const rawBookScale = useTransform(heroProgress, [0, 1], [1, reduceMotion ? 1 : .9])
  const bookY = useSpring(rawBookY, { stiffness: 90, damping: 24, mass: .55 })
  const bookRotate = useSpring(rawBookRotate, { stiffness: 90, damping: 24, mass: .55 })
  const bookScale = useSpring(rawBookScale, { stiffness: 90, damping: 24, mass: .55 })
  const reveal = reduceMotion ? {} : {
    initial: { opacity: 0, y: 36 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: .18 },
    transition: { duration: .7, ease: [0.22, 1, 0.36, 1] as const },
  }

  const directoryCta = `Get the directory ${formatPrice(PRICE_USD)}`

  useEffect(() => {
    const updateMobileCta = () => {
      const purchaseTop = purchaseRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      const hasLeftHero = window.scrollY > Math.min(420, window.innerHeight * .48)
      const purchaseIsApproaching = purchaseTop < window.innerHeight * .88
      setShowMobileCta(hasLeftHero && !purchaseIsApproaching)
    }

    updateMobileCta()
    window.addEventListener('scroll', updateMobileCta, { passive: true })
    window.addEventListener('resize', updateMobileCta)
    return () => {
      window.removeEventListener('scroll', updateMobileCta)
      window.removeEventListener('resize', updateMobileCta)
    }
  }, [])

  return (
    <main id="top">
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="site-header"><div className="shell header-inner">
        <a className="brand" href="#top" aria-label="Landed home"><span className="brand-mark">L</span><span><strong>LANDED</strong><small>by FayFay</small></span></a>
        <a className="header-cta" href="#checkout">{directoryCta} <ArrowRight size={15} /></a>
      </div></header>

      <div id="content">
        {/* 1 — Hero */}
        <section className="hero shell" ref={heroRef}>
          <motion.div className="cover-scene" aria-label="Landed book cover" initial={reduceMotion ? false : { opacity: 0, y: 45, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: .12, duration: .9, ease: [0.22, 1, 0.36, 1] }}>
            <motion.div className="book-motion" style={{ x: '-50%', y: bookY, rotate: bookRotate, scale: bookScale }}>
              <motion.button
                type="button"
                className="book-cover"
                aria-pressed={showBack}
                aria-label={showBack ? 'Showing the back cover. Click to see the front cover.' : 'Showing the front cover. Click to see the back cover.'}
                onClick={() => setShowBack((value) => !value)}
                animate={{ rotateY: showBack ? 180 : 0 }}
                whileHover={reduceMotion || showBack ? undefined : { rotateX: -5, rotateY: -9, scale: 1.035 }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 24 }}
              >
                <span className="cover-face cover-front"><Image src="/images/landed/landed-front.jpg" alt="LANDED: The Guangzhou and Guangdong Sourcing Directory, front cover" fill priority sizes="(max-width: 700px) 277px, 330px" style={{ objectFit: 'cover' }} /></span>
                <span className="cover-face cover-back"><Image src="/images/landed/landed-back.jpg" alt="LANDED back cover: what's inside and about the author" fill sizes="(max-width: 700px) 277px, 330px" style={{ objectFit: 'cover' }} /></span>
              </motion.button>
            </motion.div>
            <div className="cover-caption"><button type="button" onClick={() => setShowBack((value) => !value)}><RotateCcw size={11} /> {showBack ? 'See front cover' : 'See back cover'}</button><span>{showBack ? 'Back' : 'Front'}</span></div>
          </motion.div>
          <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="overline"><span /> FAYFORT International Trading</p>
            <h1>The fair is Plan A. <em>Nobody hands you Plan B.</em></h1>
            <p className="hero-lede">LANDED is a working directory of the wholesale markets and factories of Guangzhou and Guangdong — where to go, which building, which floor, and the address in Chinese to show your driver.</p>
            <div className="hero-actions"><a className="button button-primary" href="#checkout">{directoryCta} <ArrowRight size={17} /></a><a className="text-button" href="#inside">What’s actually inside <ArrowDown size={15} /></a></div>
            <p className="hero-trust">Written on the ground in Guangzhou <i>·</i> Every entry dated <i>·</i> Updated continuously, not reprinted</p>
          </motion.div>
        </section>

        {/* 2 — The problem */}
        <section className="stakes shell section-space">
          <div className="section-kicker"><span>01</span><p>The problem</p></div>
          <div className="stakes-layout"><h2>Ten thousand pieces. Per colour. Per design.</h2><div className="body-copy">
            <p>That is a normal minimum order at the Canton Fair. Not extreme. Normal.</p>
            <p>Take a modest garment at four dollars. Ten thousand pieces in three colours is a hundred and twenty thousand dollars — before freight, before duty, before you have sold one unit.</p>
            <p>That is the conversation a lot of first-time visitors have on day two, standing at a booth, having already spent several thousand dollars to get there.</p>
            <p>The fair is not a shop. It is a showroom for wholesale manufacturing, and showrooms do not sell single units.</p>
          </div></div>
        </section>

        {/* 3 — What you do instead */}
        <section className="promise dark-section"><div className="shell">
          <div className="promise-grid">
            <div><div className="section-kicker light"><span>02</span><p>What you do instead</p></div><h2>There are close to a thousand markets around that building.</h2></div>
            <div className="promise-copy">
              <p>Guangzhou is a trading city inside a province that manufactures for most of the world. Around the fair complex sit close to a thousand specialised wholesale markets, open every day of the year, with minimums measured in dozens rather than tens of thousands. Behind those, in towns an hour or two away, are the factories that supply them.</p>
              <p>None of it closes when the fair closes. None of it requires a badge.</p>
              <p>The problem was never that the markets are secret. It is that the people who know them do not write them down, and the people who write market guides have usually never stood in the buildings.</p>
            </div>
          </div>
          <blockquote className="pull-quote"><span>“</span>You do not find out which address is wrong at your desk. You find out in a taxi.</blockquote>
        </div></section>

        {/* 4 — Why the free lists fail */}
        <section className="why shell section-space">
          <div className="section-kicker"><span>03</span><p>Why the free lists fail</p></div>
          <div className="section-title-row"><h2>Everyone read the same page <em>you did.</em></h2><div>
            <p>Type any version of “Guangzhou wholesale market” into a search engine and almost every result is a blog post written by a sourcing agent. That is not a conspiracy, it is arithmetic — agents are the only people with a commercial reason to publish market lists, because the list is the advertisement.</p>
            <p>Three things follow.</p>
          </div></div>
          <div className="feature-grid">{failures.map(({ title, copy }, index) => <motion.article className="patterned-card" key={title} {...reveal} transition={{ ...reveal.transition, delay: index * .09 }}><CardPattern type={(['current', 'factory', 'independent'] as const)[index]} /><div className="card-content"><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></div></motion.article>)}</div>
        </section>

        {/* 5 — What's in the book */}
        <section className="contents-section" id="inside"><div className="shell section-space">
          <div className="section-kicker"><span>04</span><p>What’s in the book</p></div>
          <div className="contents-heading"><h2>What’s in it</h2></div>
          <div className="inside-grid">{inside.map(({ icon: Icon, title, copy }, index) => <motion.article className="inside-card" key={title} {...reveal} transition={{ ...reveal.transition, delay: index * .09 }}><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></motion.article>)}</div>
          <p className="inside-plus"><strong>Plus:</strong> entry, visas and badges — including the application window that closes days after the fair has already opened, and the invitation letter a small industry will happily sell you for money even though it is free.</p>
        </div></section>

        {/* 6 — The live directory */}
        <section className="directory-section dark-section"><div className="shell section-space">
          <div className="section-kicker light"><span>05</span><p>The live directory</p></div>
          <div className="directory-grid">
            <div className="directory-copy">
              <h2>A printed list starts dying the day it ships.</h2>
              <p>Markets move. Stalls change hands. Buildings get redeveloped and whole trades relocate across a city.</p>
              <p>So this isn’t a file. Your purchase includes access to the live directory — the full, searchable, continuously corrected version. Entries are added as they are verified. Corrections are logged with the date they were made. When a reader tells us a market has moved, it gets checked and published, and the next person doesn’t lose the morning that reader lost.</p>
              <p>That is also why access is personal and not transferable. Someone passing you a copied file is passing you a photograph of somewhere that has probably moved.</p>
              <ul className="tick-list">{directoryFeatures.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul>
            </div>
            <figure className="directory-figure">
              <motion.div {...reveal}><DirectoryCarousel /></motion.div>
              <figcaption>The Chinese address is the part that matters. Screenshot it, show your driver the screen, and stop trying to pronounce the market name.</figcaption>
            </figure>
          </div>
        </div></section>

        {/* 7 — Who it's for */}
        <section className="fit shell section-space"><div className="fit-grid">
          <div><div className="section-kicker"><span>06</span><p>Who it’s for</p></div><h2>This is for you if…</h2><ul className="fit-list yes">
            <li><Check />You buy from China, or you are about to.</li>
            <li><Check />You are going to Guangzhou and want the days to count.</li>
            <li><Check />You have been quoted a minimum you cannot meet.</li>
            <li><Check />You suspect you are paying more than the person beside you.</li>
            <li><Check />You want the address, not a contact form.</li>
          </ul></div>
          <div className="no-fit"><p className="mini-label">An honest no</p><h2>This is not for you if…</h2><ul className="fit-list no">
            <li><X />You are looking for a supplier list to resell.</li>
            <li><X />You want dropshipping suppliers or Alibaba alternatives.</li>
            <li><X />You have never bought wholesale and want a beginner’s course.</li>
          </ul></div>
        </div></section>

        {/* 8 — Pricing */}
        <section className="buy-section" id="pricing" ref={purchaseRef}><div className="shell section-space">
          <div className="section-kicker light"><span>07</span><p>Pricing</p></div>
          <div className="single-tier">
            <div className="single-tier-intro">
              <h2>What it costs</h2>
              <p>One price. The book, the live directory, and the hotel, restaurant and services directories.</p>
            </div>
            <motion.article className="buy-card featured" id="checkout" {...reveal}><div className="card-content">
              <div className="card-top"><span>LANDED + FaySource Access</span><small>Instant delivery</small></div>
              <div className="price"><small>Price</small><strong>{PRICE_WAS_USD !== null && <s aria-label={`Was ${formatPrice(PRICE_WAS_USD)}`}>{formatPrice(PRICE_WAS_USD)}</s>}<span aria-label={`Now ${formatPrice(PRICE_USD)}`}>{formatPrice(PRICE_USD)}</span></strong></div>
              <ul className="tier-list">{included.map((item) => <li key={item}><Check />{item}</li>)}</ul>
              <a className="button button-primary" href={CHECKOUT_URL} target="_blank" rel="noreferrer">{directoryCta} <ArrowRight size={17} /></a>
            </div></motion.article>
          </div>
          <div className="pricing-notes">
            <p>LANDED is also on Amazon. That edition is the book on its own. This one includes the live directory, which is the part that keeps working after you get home.</p>
            <div>
              <p className="sourcing-note">Want someone on the ground instead? Sourcing, factory visits, inspection, consolidation and freight are quoted per job. <a href={SOURCING_ENQUIRY_URL}>Tell us what you need</a>.</p>
              <small>Access is issued to one named subscriber and is personal and non-transferable, including within the same business. Digital product. See terms before purchase.</small>
            </div>
          </div>
        </div></section>

        {/* 9 — About FayFay */}
        <section className="author-section dark-section" id="author"><div className="shell author-grid">
          <div className="author-portrait"><Image src="/images/landed/fayfay.jpg" alt="FayFay, founder of FAYFORT International Trading" fill sizes="(max-width: 700px) 100vw, 45vw" style={{ objectFit: 'cover', objectPosition: '50% 25%' }} /></div>
          <div className="author-copy"><div className="section-kicker light"><span>08</span><p>About FayFay</p></div><h2>Who wrote this</h2>
            <p>I run FAYFORT International Trading — a trading, logistics and consultancy company based in China. I have been here eight years. I speak the language, I know how the markets work, and more usefully, I know which of them are worth your time.</p>
            <p>Most people buying from China are not buying from the factory. They are buying from someone who bought from someone who bought from the factory, and every one of those people took a margin. My work is going directly to the source — finding the factory, walking the market, checking the goods, packing them properly and getting them home.</p>
            <p>I wrote this because I kept answering the same questions. Where do I buy hair? Why is this so expensive? Which market has men’s clothing? I went to Guangzhou for a week and came home with nothing.</p>
            <p>The addresses in this book are the answer to most of them. They are not secret and they are not magic — they are just hard to find, because the people who know them do not write them down.</p>
            <p className="author-sign">So I wrote them down.</p>
          </div>
        </div></section>

        {/* 10 — FAQ */}
        <section className="faq shell section-space" id="questions"><div className="section-kicker"><span>09</span><p>Questions</p></div><div className="faq-grid"><div><h2>The things you were about to ask.</h2></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>

        {/* 11 — Final CTA */}
        <section className="final-cta shell"><h2>You are not being cheated. <em>You are being priced according to how easily you can check.</em></h2><p>Everything in this directory is about making it easy to check.</p><a className="button button-primary" href="#checkout">{directoryCta} <ArrowRight size={17} /></a></section>
      </div>

      <footer className="site-footer"><div className="shell footer-main">
        <div><a className="brand footer-brand" href="#top"><span className="brand-mark">L</span><span><strong>LANDED</strong><small>by FayFay</small></span></a><p>FAYFORT International Trading<br />Published by The Hard Way Press</p></div>
        <div><span>Contact</span><a href={`mailto:${SUPPORT_EMAIL}`}>Corrections: {SUPPORT_EMAIL}</a><a href={SOURCING_ENQUIRY_URL}>Sourcing enquiries</a><a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noreferrer">Instagram: @{INSTAGRAM_HANDLE}</a></div>
        <div><span>Legal</span><p>Terms · Privacy · Access &amp; Licence Terms · Refund Policy</p></div>
      </div><div className="shell footer-bottom"><p>© 2026 FayFay / FAYFORT International Trading. WondaTechnologies LV, Nevada.</p></div></footer>
      <AnimatePresence>
        {showMobileCta && <motion.a
          className="mobile-buy"
          href="#checkout"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 70 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 70 }}
          transition={{ duration: .38, ease: [0.22, 1, 0.36, 1] }}
        ><span>{directoryCta}</span><ArrowRight size={17} /></motion.a>}
      </AnimatePresence>
    </main>
  )
}
