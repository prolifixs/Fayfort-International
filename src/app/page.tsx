'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight, BadgeDollarSign, BookOpen, Boxes, Building2, Check, CheckCheck, ClipboardCheck, Clock3, CreditCard, Factory, Globe2, Headphones, Landmark, Map, MapPin, MessageCircle, PackageCheck, PackageSearch, Plane, Play, SearchCheck, Ship, ShieldCheck, Smartphone, Volume2, X } from 'lucide-react'

const manufacturerConversation = [
  { side: 'buyer', label: 'You · 09:12', text: 'Are you the manufacturer of this product, or a trading company?', note: 'Ask directly. Never infer from the booth or product photos.' },
  { side: 'supplier', label: 'Manufacturer · 09:14', text: 'We manufacture it. Our factory is in Foshan and we have three production lines.', note: 'A confident answer is useful—but it is not verification.' },
  { side: 'buyer', label: 'You · 09:16', text: 'Please send your business licence, factory address, recent production video, and the name on the receiving bank account.', note: 'Specific requests make vague suppliers reveal themselves quickly.' },
  { side: 'supplier', label: 'Manufacturer · 09:22', text: 'Sent. You are also welcome to inspect the factory before placing the order.', note: 'Cross-check the company name, address, licence, and payment beneficiary.' },
  { side: 'buyer', label: 'You · 09:28', text: 'Good. Quote 500 and 1,000 units separately, with packaging, lead time, payment terms, and FOB price.', note: 'Put every commercial variable in writing before negotiating.' },
]

const faqs = [
  ['Is the information current?', 'Yes. Landed was written in 2026. Details that change between sessions—dates, fees, and application windows—are kept together in one appendix so they can be updated.'],
  ['I’m not Nigerian. Is this still for me?', 'Yes. The book sorts readers by passport and explains each route separately. The Nigerian route receives the most detail because it is one of the most demanding.'],
  ['Do I need a visa for China?', 'That depends entirely on your passport. Chapter Five helps you identify your route in about a minute.'],
  ['I’ve never imported anything. Is this too advanced?', 'No. It assumes no importing experience and no prior knowledge of China. It begins with whether the trip makes sense for you at all.'],
  ['I can’t go this year. Is it still useful?', 'Yes. Most of the book covers supplier verification, negotiation, inspection, shipping, and landed cost—skills that are useful whether or not you attend the fair.'],
  ['Is there an audiobook?', 'The audiobook release details will be announced soon.'],
]

function CardPattern({ type }: { type: 'current' | 'factory' | 'independent' | 'fair' | 'inspection' | 'africa' | 'global' }) {
  const patterns = {
    current: [Clock3, Map, Smartphone, Clock3, Map, Smartphone, Clock3, Map, Smartphone],
    factory: [Factory, Boxes, PackageSearch, Factory, Boxes, PackageSearch, Factory, Boxes, PackageSearch],
    independent: [ShieldCheck, SearchCheck, ClipboardCheck, ShieldCheck, SearchCheck, ClipboardCheck, ShieldCheck, SearchCheck, ClipboardCheck],
    fair: [MessageCircle, Factory, Plane, MapPin, Building2, MessageCircle, Map, Plane, Factory, MapPin, MessageCircle, Building2],
    inspection: [PackageCheck, ClipboardCheck, SearchCheck, Ship, PackageCheck, ClipboardCheck, Boxes, SearchCheck, Ship, PackageCheck, Boxes, ClipboardCheck],
    africa: [CreditCard, Landmark, Smartphone, BadgeDollarSign, CreditCard, Landmark, Smartphone, BadgeDollarSign, CreditCard],
    global: [Globe2, BookOpen, Ship, Headphones, Globe2, BookOpen, Ship, Headphones, Globe2],
  }
  return <div className={`card-icon-pattern pattern-${type}`} aria-hidden="true">{patterns[type].map((Icon, index) => <Icon key={index} />)}</div>
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const purchaseRef = useRef<HTMLElement>(null)
  const [showMobileCta, setShowMobileCta] = useState(false)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const rawBookY = useTransform(heroProgress, [0, 1], [0, reduceMotion ? 0 : -145])
  const rawBookRotate = useTransform(heroProgress, [0, 1], [3, reduceMotion ? 3 : -9])
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
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#inside">Inside the book</a><a href="#author">About FayFay</a><a href="#questions">Questions</a></nav>
        <a className="header-cta" href="#get-it">Get the book <ArrowRight size={15} /></a>
      </div></header>

      <div id="content">
        <section className="hero shell" ref={heroRef}>
          <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="overline"><span /> The independent China sourcing guide</p>
            <h1>Buy from China.<br />Land it <em>profitably.</em></h1>
            <p className="hero-lede">A practical field guide to the Canton Fair, Chinese factories, supplier checks, negotiation, shipping—and the real cost when your goods finally land.</p>
            <div className="hero-actions"><a className="button button-primary" href="#get-it">Get the book <ArrowRight size={17} /></a><a className="text-button" href="#sample">Read a sample <ArrowDown size={15} /></a></div>
            <div className="hero-proof" aria-label="Book details"><span><strong>27</strong> focused chapters</span><span><strong>3</strong> available formats</span><span><strong>2026</strong> field-ready edition</span></div>
          </motion.div>
          <motion.div className="cover-scene" aria-label="Landed book cover preview" initial={reduceMotion ? false : { opacity: 0, y: 45, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: .12, duration: .9, ease: [0.22, 1, 0.36, 1] }}>
            <div className="cover-note"><MapPin size={14} /> Written on the ground in Guangzhou</div>
            <motion.div className="book-motion" style={{ x: '-45%', y: bookY, rotate: bookRotate, scale: bookScale }}>
              <motion.div className="book-cover" whileHover={reduceMotion ? undefined : { rotateX: -5, rotateY: 9, scale: 1.035 }} transition={{ type: 'spring', stiffness: 180, damping: 24 }}>
                <div className="cover-top"><span>FAYFAY</span><span>FIELD GUIDE 01</span></div><div className="cover-title"><small>From factory floor to final port</small><strong>LANDED</strong></div><div className="cover-route" aria-hidden="true"><i /><i /><i /><i /></div><p>Sourcing at the Canton Fair<br />and beyond</p>
              </motion.div>
            </motion.div>
            <div className="cover-caption"><span>Final cover artwork pending</span><span>01 / 27</span></div>
          </motion.div>
        </section>

        <section className="proof-strip"><div className="shell proof-grid">
          <p className="section-index">Proof, not theory</p><h2>She is already where you’re trying to go.</h2><p>FayFay runs FAYFORT International Trading from China—touring factories, inspecting stock, packing containers, and shipping to buyers across West Africa.</p>
          <button className="video-trigger" type="button" aria-label="Video will be added when supplied"><span><Play size={15} fill="currentColor" /></span><span><strong>Watch from the warehouse</strong><small>15-second introduction · Video coming soon</small></span></button>
        </div></section>

        <section className="stakes shell section-space">
          <div className="section-kicker"><span>01</span><p>Before you book</p></div>
          <div className="stakes-layout"><h2>You’re about to spend a lot of money in a country you don’t know.</h2><div className="body-copy"><p>Will the visa arrive in time? Which phase should you attend? Does the person at the booth own a factory—or just a phone? What stops the shipment being different from the sample?</p><p>Search for answers and most guides end the same way: <em>contact us and we’ll handle it for you.</em></p></div></div>
          <blockquote><span>“</span>Most sourcing advice is written by people who need you not to be able to do it alone.</blockquote>
        </section>

        <section className="promise dark-section"><div className="shell promise-grid">
          <div><div className="section-kicker light"><span>02</span><p>The full journey</p></div><h2>Your kitchen table<br />to your warehouse.</h2></div>
          <div className="promise-copy"><p><em>Landed</em> follows the journey in the order you’ll actually live it: visa, registration, flight, fair floor, wholesale markets, factory towns, supplier checks, negotiation, inspection, packing, shipping, and landed cost.</p><div className="promise-stamp"><ShieldCheck size={22} /><span><strong>No filler. No upsell.</strong><small>Just the decisions that protect your trip and your money.</small></span></div></div>
        </div></section>

        <section className="why shell section-space">
          <div className="section-kicker"><span>03</span><p>Why this book</p></div>
          <div className="section-title-row"><h2>You could piece this together for free. <em>Here’s why people don’t.</em></h2><p>Free guides are fragmented, contradictory, and often written as advertising. Delegations work—but can cost thousands for a week.</p></div>
          <div className="feature-grid">{[
            ['01', 'Current, not recycled', 'Written for 2026, after entry rules, payment apps, registration, and fair logistics changed.'],
            ['02', 'Built from the floor', 'Lessons from factory visits, warehouses, inspections, packing lists, and container yards.'],
            ['03', 'Independent by design', 'The goal is to help you evaluate suppliers and make sound decisions without hidden incentives.'],
          ].map(([number, title, copy], index) => <motion.article className="patterned-card" key={number} {...reveal} transition={{ ...reveal.transition, delay: index * .09 }} whileHover={reduceMotion ? undefined : { y: -10 }}><CardPattern type={(['current', 'factory', 'independent'] as const)[index]} /><div className="card-content"><span>{number}</span><h3>{title}</h3><p>{copy}</p></div></motion.article>)}</div>
        </section>

        <section className="contents-section" id="inside"><div className="shell section-space">
          <div className="section-kicker"><span>04</span><p>A communication field guide</p></div>
          <div className="contents-heading"><h2>Talk like a buyer.<br /><em>Verify like an inspector.</em></h2><p>A view-only example of how a useful manufacturer conversation develops.</p></div>
          <div className="chapter-thread">
            <div className="thread-header"><span className="thread-avatar"><Factory size={18} /></span><div><strong>Guangzhou Manufacturer</strong><small><i /> Typical response time: a few minutes</small></div><span className="thread-status">VIEW ONLY</span></div>
            <div className="chapter-list">{manufacturerConversation.map((message, index) => (
              <motion.div
                key={message.label}
                className={`chapter ${message.side === 'supplier' ? 'chapter-left' : 'chapter-right'}`}
                initial={reduceMotion ? false : { opacity: 0, x: message.side === 'supplier' ? -52 : 52, scale: .96 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, amount: .35 }}
                transition={{ duration: .52, delay: index * .13, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="message-body"><span className="message-label">{message.label}</span><p>{message.text}</p><small>{message.side === 'buyer' ? <CheckCheck size={14} /> : null}</small></div>
                <motion.aside initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: index * .13 + .32 }}><SearchCheck size={15} /><span>{message.note}</span></motion.aside>
              </motion.div>
            ))}</div>
            <div className="typing-row"><span /><span /><span /><small>The next question should depend on the evidence you receive.</small></div>
          </div>
          <p className="appendix-note">The book includes the questions to ask, the answers that should concern you, and what to verify away from the chat.</p>
        </div></section>

        <section className="sample shell section-space" id="sample">
          <div className="section-kicker"><span>05</span><p>Read before you buy</p></div>
          <div className="sample-grid"><div className="sample-intro"><h2>Don’t take our word for it. <em>Read the pages.</em></h2><p>Two short passages that show exactly how direct—and specific—the book is.</p></div>
            <motion.article className="excerpt-card warm" {...reveal} whileHover={reduceMotion ? undefined : { rotate: -2.4, y: -12 }}>
              <CardPattern type="fair" />
              <div className="excerpt-content"><span>Chapter 03 · The three phases</span><h3>The fair is not one event. It is three.</h3><p>And if you book the wrong one, the people you flew to meet will not be in the building.</p><p>Not hard to find. Not busy. Not there.</p><p>I want to deal with this early, because it is the most expensive mistake a first-time buyer makes—and it is entirely avoidable.</p></div>
            </motion.article>
            <motion.article className="excerpt-card ink" {...reveal} transition={{ ...reveal.transition, delay: .1 }} whileHover={reduceMotion ? undefined : { rotate: 2.4, y: -12 }}><CardPattern type="inspection" /><div className="excerpt-content"><span>Chapter 23 · Inspect before you pay</span><h3>Do not pay the balance until somebody you trust has opened the cartons.</h3><p>Your deposit buys production. That is all it buys. The balance is the only leverage you have left.</p><p>The moment you release it, you have no leverage at all—only a dispute conducted at distance.</p></div></motion.article>
          </div>
        </section>

        <section className="buy-section" id="get-it" ref={purchaseRef}><div className="shell section-space">
          <div className="section-kicker light"><span>06</span><p>Choose your edition</p></div><div className="buy-heading"><h2>Start where you are.</h2><p>Ebook, paperback, and audiobook options for readers in Africa and everywhere else.</p></div>
          <div className="buy-grid">
            <motion.article className="buy-card featured patterned-card" {...reveal} whileHover={reduceMotion ? undefined : { y: -12, rotate: -.5 }}><CardPattern type="africa" /><div className="card-content"><div className="card-top"><span>For Nigeria & Africa</span><small>Direct purchase</small></div><h3>Pay locally.<br />Read immediately.</h3><p>Use a card or bank transfer in naira. Your ebook download arrives after checkout.</p><div className="price"><small>Price</small><strong>To be announced</strong></div><a className="button button-light disabled-link" href="#purchase-details">Purchase link coming soon <ArrowRight size={17} /></a></div></motion.article>
            <motion.article className="buy-card patterned-card" {...reveal} transition={{ ...reveal.transition, delay: .1 }} whileHover={reduceMotion ? undefined : { y: -12, rotate: .5 }}><CardPattern type="global" /><div className="card-content"><div className="card-top"><span>For everywhere else</span><small>Amazon</small></div><h3>Kindle &<br />paperback.</h3><p>Choose a digital or printed copy and purchase through your local Amazon store.</p><div className="price"><small>Price</small><strong>To be announced</strong></div><a className="button button-outline disabled-link" href="#purchase-details">Amazon link coming soon <ArrowRight size={17} /></a></div></motion.article>
          </div>
          <div className="audio-player" id="purchase-details">
            <div className="audio-art" aria-hidden="true"><span>COMING SOON</span><Headphones size={24} /><strong>L</strong></div>
            <button className="audio-play" type="button" disabled aria-label="Audiobook preview coming soon"><Play size={17} fill="currentColor" /></button>
            <div className="audio-track"><div className="audio-meta"><span><strong>A sample is on the way</strong><small>Landed · Narrated by FayFay · Currently in production</small></span><span className="status-pill"><Clock3 size={10} /> Coming soon</span></div><div className="waveform" aria-hidden="true">{[8,15,10,22,17,28,12,20,31,17,25,11,29,21,14,24,9,18,27,13,22,16,30,12,19,26,10,21,15,24].map((height, index) => <i key={index} style={{ height }} />)}</div><div className="audio-time"><span>—:—</span><span>Preview unlocks on release</span><span>—:—</span></div></div>
            <Volume2 className="audio-volume" size={18} aria-hidden="true" />
          </div>
        </div></section>

        <section className="fit shell section-space"><div className="fit-grid">
          <div><div className="section-kicker"><span>07</span><p>A good fit</p></div><h2>This book is for you if…</h2><ul className="fit-list yes"><li><Check />You’re planning your first sourcing trip to China.</li><li><Check />You’ve attended before and want to return with a clear plan.</li><li><Check />You import through an agent and want to understand the process.</li><li><Check />You buy online and are considering meeting suppliers in person.</li></ul></div>
          <div className="no-fit"><p className="mini-label">An honest no</p><h2>Skip it if…</h2><ul className="fit-list no"><li><X />You want a ready-made supplier list.</li><li><X />You want someone to do the work for you.</li><li><X />You’re still searching for a business idea.</li></ul></div>
        </div></section>

        <section className="author-section dark-section" id="author"><div className="shell author-grid">
          <div className="author-portrait"><div className="portrait-initial">F</div><span>Working portrait to be added</span></div>
          <div className="author-copy"><div className="section-kicker light"><span>08</span><p>About the author</p></div><h2>FayFay works where the goods begin.</h2><p>FayFay runs FAYFORT International Trading from China, sourcing goods and shipping containers for buyers across West Africa.</p><p>Her work is the ordinary, unglamorous version of the business: warehouse floors, clearance stock, factory tours, quality inspections, packing lists, and containers.</p><aside>Verified experience, client numbers, and product categories will be added before launch.</aside></div>
        </div></section>

        <section className="faq shell section-space" id="questions"><div className="section-kicker"><span>09</span><p>Questions, answered</p></div><div className="faq-grid"><div><h2>The things you were about to ask.</h2><p>Clear answers, before you commit.</p></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>

        <section className="deadline-section"><div className="shell deadline-grid"><p className="section-index">The next window</p><h2>The next Canton Fair opens <em>15 October 2026.</em></h2><div><p>It runs in three phases through 4 November. Visa application windows are fixed and vary by location—confirm yours before making travel plans.</p><small>Fair dates and visa guidance must be verified against official sources before launch.</small></div></div></section>

        <section className="final-cta shell"><p className="overline"><span /> Your next move</p><h2>Go prepared.</h2><p>The trip costs thousands. The book costs less than lunch. Make this the last decision you take without knowing what comes next.</p><a className="button button-primary" href="#get-it">Choose your edition <ArrowRight size={17} /></a></section>
      </div>

      <footer className="site-footer"><div className="shell footer-main"><div><a className="brand footer-brand" href="#top"><span className="brand-mark">L</span><span><strong>LANDED</strong><small>by FayFay</small></span></a><p>A practical field guide to buying from China and bringing your goods home.</p></div><div><span>Explore</span><a href="#inside">Inside the book</a><a href="#sample">Read a sample</a><a href="#author">About FayFay</a></div><div><span>Follow</span><p>Instagram and TikTok links will be added before launch.</p></div></div><div className="shell footer-bottom"><p>© 2026 FAYFORT International Trading</p><p>General information only. Not legal, immigration, tax, or financial advice.</p></div></footer>
      <AnimatePresence>
        {showMobileCta && <motion.a
          className="mobile-buy"
          href="#get-it"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 70 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 70 }}
          transition={{ duration: .38, ease: [0.22, 1, 0.36, 1] }}
        ><span>Get Landed</span><ArrowRight size={17} /></motion.a>}
      </AnimatePresence>
    </main>
  )
}
