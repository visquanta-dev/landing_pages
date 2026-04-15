'use client'

import { useState, useEffect } from 'react'
import type { Dealership } from '@/lib/supabase'

export default function LandingPage({ dealer: d }: { dealer: Dealership }) {
  const [page, setPage] = useState<'main' | 'privacy' | 'terms'>('main')
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Scroll reveal
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible') })
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' })
    document.querySelectorAll('.lp-reveal').forEach(el => obs.observe(el))

    // Nav scroll
    const handleScroll = () => {
      document.getElementById('lp-nav')?.classList.toggle('lp-nav-scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => { window.removeEventListener('scroll', handleScroll); obs.disconnect() }
  }, [page])

  function showPage(p: 'main' | 'privacy' | 'terms') {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setShowModal(true) }, 1500)
  }

  function closeModal() {
    setShowModal(false)
    const form = document.getElementById('lp-form') as HTMLFormElement
    form?.reset()
  }

  // Handle date validation
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isGym) return // gyms open 7 days
    const date = new Date(e.target.value + 'T00:00:00')
    if (date.getDay() === 0) {
      alert(`Sorry, ${d.dealership_name} is closed on Sundays. Please select another day.`)
      e.target.value = ''
    }
  }

  const isGym = d.business_type === 'gym'
  const isInsurance = d.business_type === 'insurance'
  const hours = d.hours || {}
  const vehicles = d.vehicles || []
  const services = d.services || []
  const insuranceProducts = d.insurance_products || []
  const c = d.primary_color || '#D4132A'
  const smsConsentText =
    d.sms_consent_text ||
    (isGym
      ? 'By providing your phone number, you consent to receive appointment and service-related text messages from this gym. Message frequency may vary.'
      : isInsurance
      ? 'By providing your phone number, you consent to receive policy and service-related text messages from this insurance agency. Message frequency may vary.'
      : 'By providing your phone number, you consent to receive appointment and service-related text messages from this dealership. Message frequency may vary.')
  const smsCheckboxLabel =
    d.sms_checkbox_label ||
    'I agree to receive recurring automated text messages related to my appointment or service request.'

  const defaultGymServices = [
    { name: 'Group Fitness', icon: '\u{1F3CB}\uFE0F', desc: 'High-energy classes including HIIT, cycling, yoga, and more.' },
    { name: 'Pilates Reformer+', icon: '\u{1F9D8}', desc: 'Reformer-based Pilates for core strength, flexibility, and balance.' },
    { name: 'Personal Training', icon: '\u{1F4AA}', desc: 'One-on-one sessions tailored to your goals with certified trainers.' },
  ]
  const gymServices = services.length > 0
    ? services.map(s => ({ name: s.name, icon: '\u{1F3CB}\uFE0F', desc: s.description }))
    : defaultGymServices

  const defaultInsuranceProducts = [
    { name: 'Auto Insurance', icon: '\u{1F697}', desc: 'Comprehensive coverage for your vehicles with competitive rates and bundling options.' },
    { name: 'Home Insurance', icon: '\u{1F3E0}', desc: 'Protect your home and belongings with customizable coverage plans.' },
    { name: 'Life Insurance', icon: '\u{1F6E1}\uFE0F', desc: 'Secure your family\'s future with term and whole life policies.' },
  ]
  const insProducts = insuranceProducts.length > 0
    ? insuranceProducts.map(p => ({ name: p.name, icon: '\u{1F6E1}\uFE0F', desc: p.description }))
    : defaultInsuranceProducts

  const gymTimes = ['5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM']
  const dealerTimes = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM']
  const times = isGym ? [...gymTimes, ...dealerTimes] : isInsurance ? dealerTimes : dealerTimes

  // Generate darker shade
  const cDark = adjustColor(c, -20)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        :root{--c:${c};--cd:${cDark};--cg:${c}40}
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Outfit',-apple-system,sans-serif;background:#090909;color:#FAFAFA;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        body::after{content:'';position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:0.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-repeat:repeat;background-size:256px}
        .lp-reveal{opacity:0;transform:translateY(40px);transition:opacity 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s cubic-bezier(0.16,1,0.3,1)}
        .lp-visible{opacity:1;transform:translateY(0)}
        .lp-d1{transition-delay:0.1s}.lp-d2{transition-delay:0.2s}.lp-d3{transition-delay:0.3s}
        .fd{font-family:'Cormorant Garamond',Georgia,serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 8px var(--cg)}50%{box-shadow:0 0 20px var(--cg),0 0 40px ${c}1a}}
        @keyframes ring{0%{transform:scale(1);opacity:0.5}100%{transform:scale(1.4);opacity:0}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .anim-up{animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both}
        .anim-d1{animation-delay:0.1s}.anim-d2{animation-delay:0.2s}.anim-d3{animation-delay:0.3s}
        /* Nav */
        #lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 48px;height:80px;display:flex;align-items:center;justify-content:space-between;transition:all 0.4s cubic-bezier(0.16,1,0.3,1)}
        .lp-nav-scrolled{background:rgba(9,9,9,0.95)!important;backdrop-filter:blur(24px) saturate(1.2)!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;height:68px!important}
        .lp-input{width:100%;padding:15px 18px;background:#111;border:1px solid rgba(255,255,255,0.06);border-radius:10px;color:#FAFAFA;font-family:'Outfit',sans-serif;font-size:15px;outline:none;transition:all 0.3s}
        .lp-input:focus{border-color:var(--c);box-shadow:0 0 0 3px ${c}1a}
        .lp-input::placeholder{color:#333}
        select.lp-input{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 18px center}
        select.lp-input option{background:#161616}
        @media(max-width:900px){
          #lp-nav{padding:0 24px}
          .lp-nav-links{display:none!important}
          .lp-mobile-cta{display:block!important}
          .lp-hero-grid{grid-template-columns:1fr!important;padding:120px 24px 80px!important}
          .lp-hero-visual{display:none!important}
          .lp-section{padding:80px 24px!important}
          .lp-3col{grid-template-columns:1fr!important}
          .lp-form-card{padding:32px 24px!important}
          .lp-2col{grid-template-columns:1fr!important}
          .lp-trust-inner{flex-wrap:wrap;gap:24px!important}
          .lp-footer-inner{flex-direction:column;text-align:center}
          .lp-form-row{grid-template-columns:1fr!important}
          .lp-hero-ctas{flex-direction:column}.lp-hero-ctas a,.lp-hero-ctas button{width:100%;justify-content:center}
        }
      `}</style>

      {/* NAV */}
      <nav id="lp-nav">
        <a href="#" onClick={(e) => { e.preventDefault(); showPage('main') }} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
          {d.logo_url && <img src={d.logo_url} alt={d.dealership_name} style={{ height: 40, objectFit: 'contain' }} />}
          <span className="fd" style={{ fontSize: 20, fontWeight: 600, color: '#FAFAFA', letterSpacing: '-0.01em' }}>{d.dealership_name}</span>
        </a>
        <div className="lp-nav-links" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Home', 'How It Works', isGym ? 'Classes & Training' : isInsurance ? 'Coverage' : 'Vehicles', 'Contact'].map((label) => {
            const id = label === 'Home' ? '' : label === 'How It Works' ? 'how' : label === 'Contact' ? 'info' : (isGym ? 'services' : isInsurance ? 'products' : 'vehicles')
            return (
              <a key={label} href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  if (page !== 'main') setPage('main')
                  setTimeout(() => {
                    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                    else window.scrollTo({ top: 0, behavior: 'smooth' })
                  }, 50)
                }}
                style={{ color: '#A0A0A0', textDecoration: 'none', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}
              >{label}</a>
            )
          })}
          <a href="#booking"
            onClick={(e) => {
              e.preventDefault()
              if (page !== 'main') setPage('main')
              setTimeout(() => { document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }) }, 50)
            }}
            style={{ background: c, color: '#fff', padding: '11px 28px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            Book Now
          </a>
        </div>
        <a className="lp-mobile-cta" href="#booking"
          onClick={(e) => {
            e.preventDefault()
            if (page !== 'main') setPage('main')
            setTimeout(() => { document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }) }, 50)
          }}
          style={{ display: 'none', background: c, color: '#fff', padding: '11px 28px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          Book Now
        </a>
      </nav>

      {/* MAIN PAGE */}
      {page === 'main' && (
        <div>
          {/* HERO */}
          <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              {d.hero_bg_image && <img src={d.hero_bg_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3) saturate(0.7)' }} />}
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 50%, ${c}10 0%, transparent 60%), linear-gradient(180deg, rgba(9,9,9,0.2) 0%, rgba(9,9,9,0.5) 50%, #090909 100%)` }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
            </div>
            <div className="lp-hero-grid" style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '140px 48px 100px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 80, alignItems: 'center' }}>
              <div>
                <div className="anim-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, animation: 'pulse 2.5s ease infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#A0A0A0' }}>{isGym ? 'Fitness Center' : isInsurance ? 'Insurance Agency' : 'Appointment Booking'}</span>
                </div>
                <h1 className="fd anim-up anim-d1" style={{ fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 28 }}>
                  {isGym ? <>Your Fitness<br /><em style={{ fontStyle: 'italic', color: c }}>Starts Here</em></> : isInsurance ? <>Get the Coverage<br /><em style={{ fontStyle: 'italic', color: c }}>You Deserve</em></> : <>We'll Get You<br /><em style={{ fontStyle: 'italic', color: c }}>Booked In</em></>}
                </h1>
                <p className="anim-up anim-d2" style={{ fontSize: 17, color: '#A0A0A0', lineHeight: 1.75, maxWidth: 500, marginBottom: 44, fontWeight: 300 }}>
                  {isGym
                    ? `Ready for a trial session or membership consultation? Tell us what you need and we'll connect you with ${d.dealership_name} to get you started.`
                    : isInsurance
                    ? `Looking for a quote or policy review? Tell us what you need and we'll connect you with ${d.dealership_name} to find the right coverage for you.`
                    : `Need a test drive or service appointment? Tell us what you need and we'll connect you with ${d.dealership_name} to confirm the earliest available slot.`}
                </p>
                <div className="anim-up anim-d3 lp-hero-ctas" style={{ display: 'flex', gap: 16 }}>
                  <a href="#booking" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '20px 40px', background: c, color: '#FFFFFF', borderRadius: 8, fontSize: 17, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' as const, boxShadow: `0 8px 30px ${c}33`, transition: 'all 0.3s ease' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {isGym ? 'Get Started' : isInsurance ? 'Get a Quote' : 'Book an Appointment'}
                  </a>
                  <a href="#how" style={{ display: 'inline-flex', alignItems: 'center', padding: '18px 36px', background: 'transparent', color: '#E8E8E8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Learn More</a>
                </div>
              </div>
              <div className="lp-hero-visual anim-up anim-d3" style={{ position: 'relative' }}>
                {d.hero_card_image && (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                    <img src={d.hero_card_image} alt="" style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 20, right: 20, background: c, color: '#fff', padding: '8px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Now Booking</div>
                    <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, background: 'rgba(9,9,9,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      {d.logo_url && <img src={d.logo_url} alt="" style={{ width: 44, height: 44, objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 5 }} />}
                      <div>
                        <strong style={{ fontSize: 15, display: 'block', marginBottom: 2 }}>{d.dealership_name}</strong>
                        <span style={{ fontSize: 12, color: '#666' }}>{d.address_city ? `${d.address_city}, ${d.address_state}` : ''}{isGym ? ' • Fitness & Wellness' : isInsurance ? ' • Insurance & Financial Services' : ' • New & Used Vehicles'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* TRUST */}
          <section style={{ padding: 48, borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111' }}>
            <div className="lp-trust-inner" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 64 }}>
              {(isGym ? [
                { icon: '🏋️', title: 'Certified Trainers', sub: 'Expert fitness professionals' },
                { icon: '⏱️', title: 'Flexible Scheduling', sub: 'Classes from early morning to evening' },
                { icon: '💬', title: 'SMS Confirmation', sub: 'Instant booking updates' },
              ] : isInsurance ? [
                { icon: '🛡️', title: 'Licensed Agency', sub: `${d.brand} authorized agent` },
                { icon: '⏱️', title: 'Fast Quotes', sub: 'Compare rates in minutes' },
                { icon: '💬', title: 'SMS Updates', sub: 'Policy reminders & confirmations' },
              ] : [
                { icon: '🛡️', title: 'Verified Dealership', sub: `Authorized ${d.brand} Dealer` },
                { icon: '⏱️', title: 'Same-Day Response', sub: 'Confirmation within hours' },
                { icon: '💬', title: 'SMS Confirmation', sub: 'Instant booking updates' },
              ]).map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${c}14`, border: `1px solid ${c}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#E8E8E8' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how" className="lp-section" style={{ padding: '120px 48px', position: 'relative' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <p className="lp-reveal" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: c, marginBottom: 16 }}>Simple Process</p>
              <h2 className="fd lp-reveal lp-d1" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.1 }}>How It Works</h2>
              <p className="lp-reveal lp-d2" style={{ fontSize: 16, color: '#A0A0A0', maxWidth: 500, marginBottom: 64, fontWeight: 300, lineHeight: 1.7 }}>Three easy steps to secure your spot at {d.dealership_name}.</p>
              <div className="lp-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {(isGym ? [
                  { num: '01', title: 'Choose Your Activity', desc: "Select a group fitness class, personal training session, Pilates, or schedule a gym tour." },
                  { num: '02', title: 'Pick Your Preferred Time', desc: "Let us know when works best and we'll coordinate with the gym to match your schedule." },
                  { num: '03', title: 'We Confirm Your Spot', desc: `We work directly with ${d.dealership_name} to get you the earliest available session and confirm via SMS.` },
                ] : isInsurance ? [
                  { num: '01', title: 'Choose Your Coverage', desc: "Tell us what type of insurance you need — auto, home, life, or a bundle of policies." },
                  { num: '02', title: 'Pick a Time to Talk', desc: "Select a convenient time and we'll coordinate with the agency to schedule your consultation." },
                  { num: '03', title: 'Get Your Quote', desc: `We work directly with ${d.dealership_name} to get you the best rates and confirm your appointment via SMS.` },
                ] : [
                  { num: '01', title: 'Tell Us What You Need', desc: "Select whether you'd like a test drive, service appointment, or have a general inquiry about a vehicle." },
                  { num: '02', title: 'Pick Your Preferred Time', desc: "Let us know when works best and we'll coordinate with the dealership to match your schedule." },
                  { num: '03', title: 'We Confirm Your Slot', desc: `We work directly with ${d.dealership_name} to get you the earliest available appointment and confirm via SMS.` },
                ]).map((s, i) => (
                  <div key={i} className={`lp-reveal ${i > 0 ? `lp-d${i}` : ''}`}
                    style={{ padding: '40px 32px', background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
                    <div className="fd" style={{ fontSize: 48, fontWeight: 400, color: `${c}33`, lineHeight: 1, marginBottom: 20 }}>{s.num}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: '#A0A0A0', lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VEHICLES / SERVICES */}
          {isGym ? (
            <section id="services" className="lp-section" style={{ padding: '120px 48px', background: '#111' }}>
              <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <p className="lp-reveal" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: c, marginBottom: 16 }}>What We Offer</p>
                <h2 className="fd lp-reveal lp-d1" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.1 }}>Classes & Training</h2>
                <p className="lp-reveal lp-d2" style={{ fontSize: 16, color: '#A0A0A0', maxWidth: 500, marginBottom: 64, fontWeight: 300, lineHeight: 1.7 }}>Explore the programs available at {d.dealership_name}.</p>
                <div className="lp-3col" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(gymServices.length, 3)}, 1fr)`, gap: 24 }}>
                  {gymServices.map((s, i) => (
                    <div key={i} className={`lp-reveal ${i > 0 ? `lp-d${i}` : ''}`}
                      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '40px 32px' }}>
                      <div style={{ fontSize: 40, marginBottom: 20 }}>{s.icon}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{s.name}</h3>
                      <p style={{ fontSize: 14, color: '#A0A0A0', lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : isInsurance ? (
            <section id="products" className="lp-section" style={{ padding: '120px 48px', background: '#111' }}>
              <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <p className="lp-reveal" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: c, marginBottom: 16 }}>What We Offer</p>
                <h2 className="fd lp-reveal lp-d1" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.1 }}>Coverage Options</h2>
                <p className="lp-reveal lp-d2" style={{ fontSize: 16, color: '#A0A0A0', maxWidth: 500, marginBottom: 64, fontWeight: 300, lineHeight: 1.7 }}>Explore the insurance products available at {d.dealership_name}.</p>
                <div className="lp-3col" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(insProducts.length, 3)}, 1fr)`, gap: 24 }}>
                  {insProducts.map((p, i) => (
                    <div key={i} className={`lp-reveal ${i > 0 ? `lp-d${i}` : ''}`}
                      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '40px 32px' }}>
                      <div style={{ fontSize: 40, marginBottom: 20 }}>{p.icon}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{p.name}</h3>
                      <p style={{ fontSize: 14, color: '#A0A0A0', lineHeight: 1.7, fontWeight: 300 }}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : vehicles.length > 0 && (
            <section id="vehicles" className="lp-section" style={{ padding: '120px 48px', background: '#111' }}>
              <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <p className="lp-reveal" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: c, marginBottom: 16 }}>{d.brand} Lineup</p>
                <h2 className="fd lp-reveal lp-d1" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.1 }}>Popular Models</h2>
                <p className="lp-reveal lp-d2" style={{ fontSize: 16, color: '#A0A0A0', maxWidth: 500, marginBottom: 64, fontWeight: 300, lineHeight: 1.7 }}>Explore the latest {d.brand} vehicles available at {d.dealership_name.replace(d.brand, '').trim() || d.dealership_name}.</p>
                <div className="lp-3col" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(vehicles.length, 3)}, 1fr)`, gap: 24 }}>
                  {vehicles.map((v, i) => (
                    <div key={i} className={`lp-reveal ${i > 0 ? `lp-d${i}` : ''}`}
                      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                      <div style={{ height: 240, background: 'linear-gradient(145deg, #0d0d0d, #1a1a1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <img src={v.image_url} alt={v.name} style={{ width: '88%', maxHeight: 200, objectFit: 'contain', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.6))' }} />
                      </div>
                      <div style={{ padding: '24px 28px 28px' }}>
                        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{v.name}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 500 }}>{v.type}</span>
                          <span style={{ fontSize: 14, color: c, fontWeight: 600 }}>{v.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* BOOKING FORM */}
          <section id="booking" className="lp-section" style={{ padding: '120px 48px', position: 'relative' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <p className="lp-reveal" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: c, marginBottom: 16 }}>Get Started</p>
              <h2 className="fd lp-reveal lp-d1" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.1, color: '#FFFFFF' }}>Book Your Appointment</h2>
              <p className="lp-reveal lp-d2" style={{ fontSize: 16, color: '#A0A0A0', maxWidth: 500, marginBottom: 64, fontWeight: 300, lineHeight: 1.7 }}>Fill in your details and we'll handle the rest.</p>
              
              <form id="lp-form" className="lp-form-card lp-reveal lp-d3" onSubmit={handleSubmit}
                style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 52, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent 0%, ${c} 50%, transparent 100%)` }} />
                
                <div className="lp-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>First Name</label>
                    <input className="lp-input" type="text" placeholder="John" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Last Name</label>
                    <input className="lp-input" type="text" placeholder="Smith" />
                  </div>
                </div>
                <div className="lp-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Email</label>
                    <input className="lp-input" type="email" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Phone</label>
                    <input className="lp-input" type="tel" placeholder="(555) 000-0000" />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>What can we help you with?</label>
                  <select className="lp-input" defaultValue="">
                    <option value="" disabled>Select an option</option>
                    {isGym ? (<>
                      <option>Book a Group Fitness Class</option>
                      <option>Schedule a Gym Tour</option>
                      <option>Membership Inquiry</option>
                      <option>Personal Training Inquiry</option>
                      <option>Pilates Reformer+ Info</option>
                      <option>General Question</option>
                    </>) : isInsurance ? (<>
                      <option>Get an Auto Insurance Quote</option>
                      <option>Get a Home Insurance Quote</option>
                      <option>Life Insurance Inquiry</option>
                      <option>Bundle / Multi-Policy Discount</option>
                      <option>Policy Review / Renewal</option>
                      <option>File a Claim</option>
                      <option>General Question</option>
                    </>) : (<>
                      <option>Schedule a Test Drive</option>
                      <option>Book a Service Appointment</option>
                      <option>Vehicle Inquiry</option>
                      <option>General Question</option>
                    </>)}
                  </select>
                </div>
                <div className="lp-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Preferred Date</label>
                    <input className="lp-input" type="date" min={new Date().toISOString().split('T')[0]} onChange={handleDateChange} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Preferred Time</label>
                    <select className="lp-input" defaultValue="">
                      <option value="" disabled>Select a time</option>
                      {times.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Additional Details</label>
                  <textarea className="lp-input" placeholder={isGym ? "Tell us more — fitness goals, class preferences, experience level, etc." : isInsurance ? "Tell us more — current coverage, vehicles/property to insure, budget, etc." : "Tell us more — vehicle of interest, type of service, etc."} style={{ minHeight: 100, resize: 'vertical' }} />
                </div>

                {/* SMS Consent */}
                <div style={{ marginTop: 28, padding: 24, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(255,255,255,0.015)' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#E8E8E8', marginBottom: 14 }}>SMS Communications Consent</p>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: '#999', marginBottom: 14 }}>{smsConsentText}</p>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3, width: 18, height: 18, accentColor: c, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: 15, lineHeight: 1.65, color: '#B0B0B0', cursor: 'pointer' }}>
                      I agree to receive recurring text messages from {d.dealership_name} at the number provided. Message frequency may vary. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe.
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  style={{ marginTop: 32, width: '100%', padding: 22, background: c, color: '#FFFFFF', border: 'none', borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' as const, opacity: submitting ? 0.5 : 1, transition: 'all 0.3s ease', boxShadow: `0 8px 30px ${c}33` }}>
                  {submitting ? 'Submitting...' : 'Submit Appointment Request'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); showPage('privacy') }} style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}>Privacy Policy</a>
                  <span style={{ color: '#333', fontSize: 12 }}>|</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); showPage('terms') }} style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}>Terms & Conditions</a>
                </div>
              </form>
            </div>
          </section>

          {/* DEALER INFO */}
          <section id="info" className="lp-section" style={{ padding: '120px 48px', background: '#111' }}>
            <div className="lp-2col" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
              <div>
                <p className="lp-reveal" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: c, marginBottom: 16 }}>{isGym ? 'Gym Details' : isInsurance ? 'Agency Details' : 'Dealership Details'}</p>
                <h2 className="fd lp-reveal lp-d1" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 40, lineHeight: 1.1 }}>{d.dealership_name}</h2>
                {d.address_full && (
                  <div className="lp-reveal lp-d2" style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 32 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c}0f`, border: `1px solid ${c}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📍</div>
                    <div>
                      <p style={{ fontSize: 11, color: '#333', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 }}>Address</p>
                      <p style={{ fontSize: 16, fontWeight: 500 }}>
                        <a href={d.maps_url || '#'} target="_blank" rel="noopener" style={{ color: '#E8E8E8', textDecoration: 'none' }}>{d.address_full}</a>
                      </p>
                    </div>
                  </div>
                )}
                {d.phone_sales && (
                  <div className="lp-reveal lp-d3" style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 32 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c}0f`, border: `1px solid ${c}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📞</div>
                    <div>
                      <p style={{ fontSize: 11, color: '#333', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 }}>{isGym ? 'Phone' : isInsurance ? 'Office' : 'Sales'}</p>
                      <p style={{ fontSize: 16, fontWeight: 500 }}>
                        <a href={`tel:${d.phone_sales?.replace(/\D/g, '')}`} style={{ color: '#E8E8E8', textDecoration: 'none' }}>{d.phone_sales}</a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="lp-reveal" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 36 }}>
                <h3 className="fd" style={{ fontSize: 24, fontWeight: 500, marginBottom: 24 }}>Working Hours</h3>
                {Object.entries(hours).map(([day, time]) => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14 }}>
                    <span style={{ color: '#666', fontWeight: 400, textTransform: 'capitalize' }}>{day}</span>
                    <span style={{ fontWeight: 500, color: '#E8E8E8' }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* PRIVACY PAGE */}
      {page === 'privacy' && (
        <div style={{ padding: '140px 48px 100px', maxWidth: 720, margin: '0 auto', animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); showPage('main') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: c, textDecoration: 'none', fontSize: 13, fontWeight: 500, marginBottom: 40 }}>← Back to Home</a>
          <h1 className="fd" style={{ fontSize: 40, fontWeight: 500, marginBottom: 8, letterSpacing: '-0.02em' }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: '#333', marginBottom: 48 }}>Effective Date: {d.privacy_effective_date || 'Sep 15, 2025'}</p>
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.85, fontWeight: 300 }}>
            <p style={{ marginBottom: 16 }}>At {d.legal_entity_name} (operating at {d.subdomain}.visquanta.com) we respect and value your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or engage with us in other ways.</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '36px 0 12px', color: '#E8E8E8' }}>1. Information We Collect</h2>
            <p style={{ marginBottom: 16 }}><strong style={{ color: '#E8E8E8', fontWeight: 500 }}>Personal Identification Information:</strong> Name, email address, phone number, and other similar contact data.</p>
            <p style={{ marginBottom: 16 }}><strong style={{ color: '#E8E8E8', fontWeight: 500 }}>Technical Information:</strong> IP address, browser type, operating system, and browsing habits through cookies and similar technologies.</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '36px 0 12px', color: '#E8E8E8' }}>2. How We Use Your Information</h2>
            <p style={{ marginBottom: 16 }}>We may use the information we collect to provide and maintain our services, improve user experience, process transactions, communicate with you, and comply with legal obligations.</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '36px 0 12px', color: '#E8E8E8' }}>3. Information Sharing and Disclosure</h2>
            <p style={{ marginBottom: 16 }}>No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services is permitted. All other use case categories exclude text messaging originator opt-in data and consent.</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '36px 0 12px', color: '#E8E8E8' }}>4. Data Security</h2>
            <p style={{ marginBottom: 16 }}>We are committed to protecting your personal information using industry-standard security measures.</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '36px 0 12px', color: '#E8E8E8' }}>5. SMS / Text Messaging Program</h2>
            <p style={{ marginBottom: 16 }}>When you provide your mobile phone number through a form on this website and check the SMS consent box, you agree to receive recurring text messages from {d.legal_entity_name}{d.dba_name ? ` (DBA ${d.dba_name})` : ''} related to appointments, service updates, and account notifications. Consent is not a condition of purchase.</p>
            <p style={{ marginBottom: 16 }}><strong style={{ color: '#E8E8E8', fontWeight: 500 }}>Message frequency:</strong> Message frequency may vary based on your interactions with us.</p>
            <p style={{ marginBottom: 16 }}><strong style={{ color: '#E8E8E8', fontWeight: 500 }}>Costs:</strong> Message and data rates may apply. Check with your mobile carrier for details.</p>
            <p style={{ marginBottom: 16 }}><strong style={{ color: '#E8E8E8', fontWeight: 500 }}>Help:</strong> Reply HELP for help{d.phone_sms_help ? ` or call ${d.phone_sms_help}` : ''}{d.email ? ` or email ${d.email}` : ''}.</p>
            <p style={{ marginBottom: 16 }}><strong style={{ color: '#E8E8E8', fontWeight: 500 }}>Opt-out:</strong> Reply STOP to unsubscribe at any time. After unsubscribing, you will receive one confirmation message and no further texts.</p>
            <p style={{ marginBottom: 16 }}><strong style={{ color: '#E8E8E8', fontWeight: 500 }}>Privacy of mobile information:</strong> No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. Mobile opt-in data and consent will not be shared with any third party.</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '36px 0 12px', color: '#E8E8E8' }}>6. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at: {d.phone_sales && <a href={`tel:${d.phone_sales.replace(/\D/g, '')}`} style={{ color: c }}>{d.phone_sales}</a>}{d.email && <span> or <a href={`mailto:${d.email}`} style={{ color: c }}>{d.email}</a></span>}. Website: {d.subdomain}.visquanta.com</p>
          </div>
        </div>
      )}

      {/* TERMS PAGE */}
      {page === 'terms' && (
        <div style={{ padding: '140px 48px 100px', maxWidth: 720, margin: '0 auto', animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); showPage('main') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: c, textDecoration: 'none', fontSize: 13, fontWeight: 500, marginBottom: 40 }}>← Back to Home</a>
          <h1 className="fd" style={{ fontSize: 40, fontWeight: 500, marginBottom: 8, letterSpacing: '-0.02em' }}>Terms and Conditions</h1>
          <p style={{ fontSize: 13, color: '#333', marginBottom: 48 }}>Effective Date: {d.terms_effective_date || 'Sep 15, 2025'}</p>
          <ol style={{ listStyle: 'decimal', paddingLeft: 20, fontSize: 14, color: '#666', lineHeight: 1.85, fontWeight: 300 }}>
            <li style={{ marginBottom: 12 }}>This SMS program sends recurring automated appointment confirmations, service reminders, rescheduling notifications, and other account-related updates from {d.legal_entity_name} {d.dba_name ? `(DBA ${d.dba_name})` : ''} (website: {d.subdomain}.visquanta.com) to customers who have opted in. No promotional or marketing messages are sent.</li>
            <li style={{ marginBottom: 12 }}>You can cancel at any time by replying STOP.</li>
            <li style={{ marginBottom: 12 }}>If you experience issues, reply HELP for assistance{d.phone_sms_help ? ` or call ${d.phone_sms_help}` : ''}{d.email ? ` or email ${d.email}` : ''}.</li>
            <li style={{ marginBottom: 12 }}>Carriers are not liable for delayed or undelivered messages.</li>
            <li style={{ marginBottom: 12 }}>Message frequency may vary. Message and data rates may apply.</li>
            <li style={{ marginBottom: 12 }}>For privacy-related inquiries, please refer to our <a href="#" onClick={(e) => { e.preventDefault(); showPage('privacy') }} style={{ color: c }}>Privacy Policy</a>.</li>
          </ol>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="lp-footer-inner" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 16 }}>
          <span style={{ fontSize: 13, color: '#333' }}>© {new Date().getFullYear()} {d.dealership_name}. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 28 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); showPage('privacy') }} style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); showPage('terms') }} style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Terms & Conditions</a>
          </div>
          <span style={{ fontSize: 11, color: '#333' }}>Powered by <a href="https://visquanta.com" target="_blank" rel="noopener" style={{ color: '#666', textDecoration: 'none', fontWeight: 600 }}>Visquanta</a></span>
        </div>
      </footer>

      {/* SUCCESS MODAL */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '48px 44px 40px', maxWidth: 420, width: '100%', textAlign: 'center' as const, animation: 'modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 32px 100px rgba(0,0,0,0.6)', position: 'relative' as const }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#333', fontSize: 24, cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>×</button>
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 28px' }}>
              <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1.5px solid #34D399', animation: 'ring 2s ease infinite' }} />
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1.5px solid #34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <h3 className="fd" style={{ fontSize: 28, fontWeight: 500, marginBottom: 10 }}>You're All Set!</h3>
            <p style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 1.65, marginBottom: 24, fontWeight: 300 }}>Your appointment request has been submitted successfully.</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: `${c}0d`, border: `1px solid ${c}1a`, borderRadius: 12, padding: '16px 18px', textAlign: 'left' as const, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>💬</div>
              <div>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 3 }}>Check your phone</strong>
                <span style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>You'll receive an SMS confirmation shortly with your appointment details.</span>
              </div>
            </div>
            <button onClick={closeModal} style={{ background: c, color: '#fff', border: 'none', padding: '14px 56px', borderRadius: 8, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </>
  )
}

function adjustColor(hex: string, amount: number): string {
  hex = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
