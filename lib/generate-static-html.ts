import type { Dealership } from './supabase'

function adjustColor(hex: string, amount: number): string {
  hex = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function esc(s: string | undefined | null): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function sharedHead(d: Dealership, title: string, c: string, cDark: string): string {
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="robots" content="noindex,nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">`
}

function sharedStyles(c: string, cDark: string): string {
  return `<style>
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
    #lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 48px;height:80px;display:flex;align-items:center;justify-content:space-between;transition:all 0.4s cubic-bezier(0.16,1,0.3,1)}
    .lp-nav-scrolled{background:rgba(9,9,9,0.95)!important;backdrop-filter:blur(24px) saturate(1.2)!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;height:68px!important}
    .lp-input{width:100%;padding:15px 18px;background:#111;border:1px solid rgba(255,255,255,0.06);border-radius:10px;color:#FAFAFA;font-family:'Outfit',sans-serif;font-size:15px;outline:none;transition:all 0.3s}
    .lp-input:focus{border-color:var(--c);box-shadow:0 0 0 3px ${c}1a}
    .lp-input::placeholder{color:#333}
    select.lp-input{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 18px center}
    select.lp-input option{background:#161616}
    #success-modal{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px);align-items:center;justify-content:center;padding:24px}
    #success-modal.active{display:flex}
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
      .lp-hero-ctas{flex-direction:column}
      .lp-hero-ctas a,.lp-hero-ctas button{width:100%;justify-content:center}
    }
  </style>`
}

function navHTML(d: Dealership, c: string): string {
  const isGym = d.business_type === 'gym'
  const isInsurance = d.business_type === 'insurance'
  const linkStyle = `color:#A0A0A0;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase`
  const thirdLink = isGym
    ? `<a href="/#services" style="${linkStyle}">Classes &amp; Training</a>`
    : isInsurance
    ? `<a href="/#products" style="${linkStyle}">Coverage</a>`
    : `<a href="/#vehicles" style="${linkStyle}">Vehicles</a>`
  const ctaLabel = isInsurance ? 'Get Quote' : 'Book Now'

  return `<nav id="lp-nav">
    <a href="/" style="display:flex;align-items:center;gap:14px;text-decoration:none">
      ${d.logo_url ? `<img src="${esc(d.logo_url)}" alt="${esc(d.dealership_name)}" style="height:40px;object-fit:contain" />` : ''}
      <span class="fd" style="font-size:20px;font-weight:600;color:#FAFAFA;letter-spacing:-0.01em">${esc(d.dealership_name)}</span>
    </a>
    <div class="lp-nav-links" style="display:flex;gap:36px;align-items:center">
      <a href="/" style="color:#A0A0A0;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase">Home</a>
      <a href="/#how" style="color:#A0A0A0;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase">How It Works</a>
      ${thirdLink}
      <a href="/#info" style="color:#A0A0A0;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase">Contact</a>
      <a href="/#booking" style="background:${esc(c)};color:#fff;padding:11px 28px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase">${ctaLabel}</a>
    </div>
    <a class="lp-mobile-cta" href="/#booking" style="display:none;background:${esc(c)};color:#fff;padding:11px 28px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase">${ctaLabel}</a>
  </nav>`
}

function footerHTML(d: Dealership, year: number): string {
  return `<footer style="padding:40px 48px;border-top:1px solid rgba(255,255,255,0.06)">
    <div class="lp-footer-inner" style="max-width:1280px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
      <span style="font-size:13px;color:#333">&copy; ${year} ${esc(d.dealership_name)}. All rights reserved.</span>
      <div style="display:flex;gap:28px">
        <a href="/privacy-policy" style="font-size:12px;color:#666;text-decoration:none">Privacy Policy</a>
        <a href="/terms-and-conditions" style="font-size:12px;color:#666;text-decoration:none">Terms &amp; Conditions</a>
      </div>
      <span style="font-size:11px;color:#333">Powered by <a href="https://visquanta.com" target="_blank" rel="noopener" style="color:#666;text-decoration:none;font-weight:600">Visquanta</a></span>
    </div>
  </footer>`
}

function revealScript(d: Dealership): string {
  return `<script>
    function initReveal() {
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('lp-visible'); });
      }, {threshold: 0.1, rootMargin: '0px 0px -60px 0px'});
      document.querySelectorAll('.lp-reveal').forEach(function(el) { obs.observe(el); });
    }
    window.addEventListener('scroll', function() {
      var nav = document.getElementById('lp-nav');
      if (nav) nav.classList.toggle('lp-nav-scrolled', window.scrollY > 50);
    });
    initReveal();
  </script>`
}

const DEFAULT_GYM_SERVICES = [
  { name: 'Group Fitness', icon: '\u{1F3CB}\uFE0F', desc: 'High-energy classes including HIIT, cycling, yoga, and more.' },
  { name: 'Pilates Reformer+', icon: '\u{1F9D8}', desc: 'Reformer-based Pilates for core strength, flexibility, and balance.' },
  { name: 'Personal Training', icon: '\u{1F4AA}', desc: 'One-on-one sessions tailored to your goals with certified trainers.' },
]

const DEFAULT_INSURANCE_PRODUCTS = [
  { name: 'Auto Insurance', icon: '\u{1F697}', desc: 'Comprehensive coverage for your vehicles with competitive rates and bundling options.' },
  { name: 'Home Insurance', icon: '\u{1F3E0}', desc: 'Protect your home and belongings with customizable coverage plans.' },
  { name: 'Life Insurance', icon: '\u{1F6E1}\uFE0F', desc: "Secure your family's future with term and whole life policies." },
]

export function generateStaticSite(d: Dealership): { file: string; data: string }[] {
  const c = d.primary_color || '#D4132A'
  const cDark = adjustColor(c, -20)
  const hours = d.hours || {}
  const vehicles = d.vehicles || []
  const year = new Date().getFullYear()
  const todayMin = new Date().toISOString().split('T')[0]
  const isGym = d.business_type === 'gym'
  const isInsurance = d.business_type === 'insurance'

  const dealerTimes = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM']
  const gymTimes = ['5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM',...dealerTimes]
  const times = isGym ? gymTimes : dealerTimes

  const smsConsentText =
    d.sms_consent_text ||
    (isGym
      ? 'By providing your phone number, you consent to receive appointment and service-related text messages from this gym. Message frequency may vary.'
      : isInsurance
      ? 'By providing your phone number, you consent to receive policy and service-related text messages from this insurance agency. Message frequency may vary.'
      : 'By providing your phone number, you consent to receive appointment and service-related text messages from this dealership. Message frequency may vary.')

  // ── VEHICLES / SERVICES SECTION ──
  let middleSectionHTML = ''

  if (isGym) {
    // Gym services section
    const gymServices = (d.services && d.services.length > 0)
      ? d.services.map(s => ({ name: s.name, icon: '\u{1F3CB}\uFE0F', desc: s.description }))
      : DEFAULT_GYM_SERVICES

    middleSectionHTML = `
    <section id="services" class="lp-section" style="padding:120px 48px;background:#111">
      <div style="max-width:1280px;margin:0 auto">
        <p class="lp-reveal" style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${esc(c)};margin-bottom:16px">What We Offer</p>
        <h2 class="fd lp-reveal lp-d1" style="font-size:clamp(32px,4vw,48px);font-weight:500;letter-spacing:-0.02em;margin-bottom:16px;line-height:1.1">Classes &amp; Training</h2>
        <p class="lp-reveal lp-d2" style="font-size:16px;color:#A0A0A0;max-width:500px;margin-bottom:64px;font-weight:300;line-height:1.7">Explore the programs available at ${esc(d.dealership_name)}.</p>
        <div class="lp-3col" style="display:grid;grid-template-columns:repeat(${Math.min(gymServices.length, 3)},1fr);gap:24px">
          ${gymServices.map((s, i) => `
            <div class="lp-reveal${i > 0 ? ` lp-d${i}` : ''}" style="background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 32px;text-align:center">
              <div style="font-size:48px;margin-bottom:20px">${s.icon}</div>
              <p style="font-size:18px;font-weight:600;margin-bottom:10px">${esc(s.name)}</p>
              <p style="font-size:14px;color:#A0A0A0;line-height:1.7;font-weight:300">${esc(s.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `
  } else if (isInsurance) {
    // Insurance products section
    const insProducts = (d.insurance_products && d.insurance_products.length > 0)
      ? d.insurance_products.map(p => ({ name: p.name, icon: '\u{1F6E1}\uFE0F', desc: p.description }))
      : DEFAULT_INSURANCE_PRODUCTS

    middleSectionHTML = `
    <section id="products" class="lp-section" style="padding:120px 48px;background:#111">
      <div style="max-width:1280px;margin:0 auto">
        <p class="lp-reveal" style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${esc(c)};margin-bottom:16px">What We Offer</p>
        <h2 class="fd lp-reveal lp-d1" style="font-size:clamp(32px,4vw,48px);font-weight:500;letter-spacing:-0.02em;margin-bottom:16px;line-height:1.1">Coverage Options</h2>
        <p class="lp-reveal lp-d2" style="font-size:16px;color:#A0A0A0;max-width:500px;margin-bottom:64px;font-weight:300;line-height:1.7">Explore the insurance products available at ${esc(d.dealership_name)}.</p>
        <div class="lp-3col" style="display:grid;grid-template-columns:repeat(${Math.min(insProducts.length, 3)},1fr);gap:24px">
          ${insProducts.map((p, i) => `
            <div class="lp-reveal${i > 0 ? ` lp-d${i}` : ''}" style="background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 32px;text-align:center">
              <div style="font-size:48px;margin-bottom:20px">${p.icon}</div>
              <p style="font-size:18px;font-weight:600;margin-bottom:10px">${esc(p.name)}</p>
              <p style="font-size:14px;color:#A0A0A0;line-height:1.7;font-weight:300">${esc(p.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `
  } else {
    // Dealership vehicles section
    middleSectionHTML = vehicles.length > 0 ? `
    <section id="vehicles" class="lp-section" style="padding:120px 48px;background:#111">
      <div style="max-width:1280px;margin:0 auto">
        <p class="lp-reveal" style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${esc(c)};margin-bottom:16px">${esc(d.brand)} Lineup</p>
        <h2 class="fd lp-reveal lp-d1" style="font-size:clamp(32px,4vw,48px);font-weight:500;letter-spacing:-0.02em;margin-bottom:16px;line-height:1.1">Popular Models</h2>
        <p class="lp-reveal lp-d2" style="font-size:16px;color:#A0A0A0;max-width:500px;margin-bottom:64px;font-weight:300;line-height:1.7">Explore the latest ${esc(d.brand)} vehicles available at ${esc(d.dealership_name?.replace(d.brand || '', '').trim() || d.dealership_name)}.</p>
        <div class="lp-3col" style="display:grid;grid-template-columns:repeat(${Math.min(vehicles.length, 3)},1fr);gap:24px">
          ${vehicles.map((v, i) => `
            <div class="lp-reveal${i > 0 ? ` lp-d${i}` : ''}" style="background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden">
              <div style="height:240px;background:linear-gradient(145deg,#0d0d0d,#1a1a1a);display:flex;align-items:center;justify-content:center;position:relative">
                <img src="${esc(v.image_url)}" alt="${esc(v.name)}" style="width:88%;max-height:200px;object-fit:contain;filter:drop-shadow(0 16px 40px rgba(0,0,0,0.6))" />
              </div>
              <div style="padding:24px 28px 28px">
                <p style="font-size:18px;font-weight:600;margin-bottom:4px">${esc(v.name)}</p>
                <div style="display:flex;justify-content:space-between;align-items:baseline">
                  <span style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.08em;font-weight:500">${esc(v.type)}</span>
                  <span style="font-size:14px;color:${esc(c)};font-weight:600">${esc(v.price)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  ` : ''
  }

  const hoursHTML = Object.entries(hours).map(([day, time]) => `
    <div style="display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px">
      <span style="color:#666;font-weight:400;text-transform:capitalize">${esc(day)}</span>
      <span style="font-weight:500;color:#E8E8E8">${esc(time as string)}</span>
    </div>
  `).join('')

  const smsConsentHTML = `
    <div style="margin-top:28px;padding:24px;border:1px solid rgba(255,255,255,0.06);border-radius:12px;background:rgba(255,255,255,0.015)">
      <p style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#E8E8E8;margin-bottom:14px">SMS Communications Consent</p>
      <p style="font-size:15px;line-height:1.75;color:#999;margin-bottom:14px">${esc(smsConsentText)}</p>
      <p style="font-size:13px;margin-bottom:18px">
        <a href="/privacy-policy" style="color:${esc(c)};text-decoration:none;font-weight:500">Privacy Policy</a>
        |
        <a href="/terms-and-conditions" style="color:${esc(c)};text-decoration:none;font-weight:500">Terms &amp; Conditions</a>
      </p>
      <div style="display:flex;gap:14px;align-items:flex-start;padding-top:18px;border-top:1px solid rgba(255,255,255,0.06)">
        <input id="sms-consent-checkbox" type="checkbox" style="margin-top:3px;width:18px;height:18px;accent-color:${esc(c)};flex-shrink:0;cursor:pointer" />
        <label style="font-size:15px;line-height:1.65;color:#B0B0B0;cursor:pointer">
          I agree to receive text messages from ${esc(d.dealership_name)}. Message &amp; data rates may apply. Reply STOP to opt out.
        </label>
      </div>
    </div>
  `

  // ── Business-type-specific content ──
  const metaDescription = isGym
    ? `Book a class, schedule a tour, or inquire about membership at ${esc(d.dealership_name)}. We'll help you get started.`
    : isInsurance
    ? `Get an insurance quote or schedule a policy review with ${esc(d.dealership_name)}. We'll help you find the right coverage.`
    : `Book a test drive or service appointment at ${esc(d.dealership_name)}. We'll confirm the earliest available slot for you.`

  const heroSubtitle = isGym ? 'Fitness Center' : isInsurance ? 'Insurance Agency' : 'Appointment Booking'
  const heroHeading = isGym
    ? `Your Fitness<br><em style="font-style:italic;color:${esc(c)}">Starts Here</em>`
    : isInsurance
    ? `Get the Coverage<br><em style="font-style:italic;color:${esc(c)}">You Deserve</em>`
    : `We'll Get You<br><em style="font-style:italic;color:${esc(c)}">Booked In</em>`
  const heroDescription = isGym
    ? `Ready to transform your fitness? Tell us what you're interested in and we'll help you get started at ${esc(d.dealership_name)}.`
    : isInsurance
    ? `Looking for a quote or policy review? Tell us what you need and we'll connect you with ${esc(d.dealership_name)} to find the right coverage for you.`
    : `Need a test drive or service appointment? Tell us what you need and we'll connect you with ${esc(d.dealership_name)} to confirm the earliest available slot.`
  const heroCta = isGym ? 'Get Started' : isInsurance ? 'Get a Quote' : 'Book an Appointment'
  const heroCardOverlay = isGym
    ? `${d.address_city ? `${esc(d.address_city)}, ${esc(d.address_state)}` : ''} &bull; Award-Winning Gym`
    : isInsurance
    ? `${d.address_city ? `${esc(d.address_city)}, ${esc(d.address_state)}` : ''} &bull; Insurance &amp; Financial Services`
    : `${d.address_city ? `${esc(d.address_city)}, ${esc(d.address_state)}` : ''} &bull; New &amp; Used Vehicles`

  // Trust badges
  const trustBadge1 = isGym
    ? `<div><div style="font-size:14px;font-weight:500;color:#E8E8E8">Certified Trainers</div><div style="font-size:12px;color:#666">Expert fitness professionals</div></div>`
    : isInsurance
    ? `<div><div style="font-size:14px;font-weight:500;color:#E8E8E8">Licensed Agency</div><div style="font-size:12px;color:#666">${esc(d.brand)} authorized agent</div></div>`
    : `<div><div style="font-size:14px;font-weight:500;color:#E8E8E8">Verified Dealership</div><div style="font-size:12px;color:#666">Authorized ${esc(d.brand)} Dealer</div></div>`

  const trustBadge2 = isInsurance
    ? `<div><div style="font-size:14px;font-weight:500;color:#E8E8E8">Fast Quotes</div><div style="font-size:12px;color:#666">Compare rates in minutes</div></div>`
    : `<div><div style="font-size:14px;font-weight:500;color:#E8E8E8">Same-Day Response</div><div style="font-size:12px;color:#666">Confirmation within hours</div></div>`

  const trustBadge3 = isInsurance
    ? `<div><div style="font-size:14px;font-weight:500;color:#E8E8E8">SMS Updates</div><div style="font-size:12px;color:#666">Policy reminders &amp; confirmations</div></div>`
    : `<div><div style="font-size:14px;font-weight:500;color:#E8E8E8">SMS Confirmation</div><div style="font-size:12px;color:#666">Instant booking updates</div></div>`

  // How it works
  const step1Title = isGym ? 'Choose Your Activity' : isInsurance ? 'Choose Your Coverage' : 'Tell Us What You Need'
  const step1Text = isGym
    ? 'Choose your interest \u2014 group classes, personal training, Pilates, a gym tour, or membership info.'
    : isInsurance
    ? 'Tell us what type of insurance you need \u2014 auto, home, life, or a bundle of policies.'
    : "Select whether you'd like a test drive, service appointment, or have a general inquiry about a vehicle."
  const step2Title = isInsurance ? 'Pick a Time to Talk' : 'Pick Your Preferred Time'
  const step2Text = isGym
    ? "Let us know when works best and we'll coordinate with the gym to match your schedule."
    : isInsurance
    ? "Select a convenient time and we'll coordinate with the agency to schedule your consultation."
    : "Let us know when works best and we'll coordinate with the dealership to match your schedule."
  const step3Title = isInsurance ? 'Get Your Quote' : 'We Confirm Your Slot'
  const step3Text = isInsurance
    ? `We work directly with ${esc(d.dealership_name)} to get you the best rates and confirm your appointment via SMS.`
    : `We work directly with ${esc(d.dealership_name)} to get you the earliest available appointment and confirm via SMS.`

  // Booking form heading
  const bookingHeading = isInsurance ? 'Get Your Quote' : 'Book Your Appointment'
  const submitLabel = isInsurance ? 'Submit Quote Request' : 'Submit Appointment Request'

  // Form service options
  const serviceOptions = isGym
    ? `<option value="" disabled selected>Select an option</option>
            <option>Book a Group Fitness Class</option>
            <option>Schedule a Gym Tour</option>
            <option>Membership Inquiry</option>
            <option>Personal Training Inquiry</option>
            <option>Pilates Reformer+ Info</option>
            <option>General Question</option>`
    : isInsurance
    ? `<option value="" disabled selected>Select an option</option>
            <option>Get an Auto Insurance Quote</option>
            <option>Get a Home Insurance Quote</option>
            <option>Life Insurance Inquiry</option>
            <option>Bundle / Multi-Policy Discount</option>
            <option>Policy Review / Renewal</option>
            <option>File a Claim</option>
            <option>General Question</option>`
    : `<option value="" disabled selected>Select an option</option>
            <option>Schedule a Test Drive</option>
            <option>Book a Service Appointment</option>
            <option>Vehicle Inquiry</option>
            <option>General Question</option>`

  const textareaPlaceholder = isGym
    ? 'Tell us more \u2014 class interest, fitness goals, preferred schedule, etc.'
    : isInsurance
    ? 'Tell us more \u2014 current coverage, vehicles/property to insure, budget, etc.'
    : 'Tell us more \u2014 vehicle of interest, type of service, etc.'

  const infoSectionLabel = isGym ? 'Gym Details' : isInsurance ? 'Agency Details' : 'Dealership Details'
  const phoneLabel = isGym ? 'Phone' : isInsurance ? 'Office' : 'Sales'

  // Date validation script (no Sunday restriction for gyms or insurance agencies)
  const dateChangeScript = isGym || isInsurance
    ? 'function handleDateChange(input) {}'
    : `function handleDateChange(input) {
      var date = new Date(input.value + 'T00:00:00');
      if (date.getDay() === 0) {
        alert('Sorry, ${esc(d.dealership_name)} is closed on Sundays. Please select another day.');
        input.value = '';
      }
    }`

  // ── INDEX.HTML ──
  const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  ${sharedHead(d, esc(d.page_title || d.dealership_name + ' \u2014 Book Your Appointment'), c, cDark)}
  <meta name="description" content="${metaDescription}">
  ${sharedStyles(c, cDark)}
</head>
<body>

  ${navHTML(d, c)}

  <!-- HERO -->
  <section style="position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden">
    <div style="position:absolute;inset:0">
      ${d.hero_bg_image ? `<img src="${esc(d.hero_bg_image)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(0.3) saturate(0.7)" />` : ''}
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,${c}10 0%,transparent 60%),linear-gradient(180deg,rgba(9,9,9,0.2) 0%,rgba(9,9,9,0.5) 50%,#090909 100%)"></div>
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px);background-size:80px 80px"></div>
    </div>
    <div class="lp-hero-grid" style="position:relative;z-index:1;max-width:1280px;margin:0 auto;width:100%;padding:140px 48px 100px;display:grid;grid-template-columns:1.1fr 0.9fr;gap:80px;align-items:center">
      <div>
        <div class="anim-up" style="display:inline-flex;align-items:center;gap:10px;margin-bottom:24px">
          <span style="width:6px;height:6px;border-radius:50%;background:${esc(c)};animation:pulse 2.5s ease infinite"></span>
          <span style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#A0A0A0">${heroSubtitle}</span>
        </div>
        <h1 class="fd anim-up anim-d1" style="font-size:clamp(44px,5.5vw,72px);font-weight:500;line-height:1.05;letter-spacing:-0.03em;margin-bottom:28px">
          ${heroHeading}
        </h1>
        <p class="anim-up anim-d2" style="font-size:17px;color:#A0A0A0;line-height:1.75;max-width:500px;margin-bottom:44px;font-weight:300">
          ${heroDescription}
        </p>
        <div class="anim-up anim-d3 lp-hero-ctas" style="display:flex;gap:16px">
          <a href="#booking" style="display:inline-flex;align-items:center;gap:10px;padding:20px 40px;background:${esc(c)};color:#FFFFFF;border-radius:8px;font-size:17px;font-weight:700;text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;box-shadow:0 8px 30px ${c}33;transition:all 0.3s ease">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${heroCta}
          </a>
          <a href="#how" style="display:inline-flex;align-items:center;padding:18px 36px;background:transparent;color:#E8E8E8;border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:15px;font-weight:500;text-decoration:none">Learn More</a>
        </div>
      </div>
      <div class="lp-hero-visual anim-up anim-d3" style="position:relative">
        ${d.hero_card_image ? `
          <div style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);box-shadow:0 40px 100px rgba(0,0,0,0.5)">
            <img src="${esc(d.hero_card_image)}" alt="" style="width:100%;height:380px;object-fit:cover;display:block" />
            <div style="position:absolute;top:20px;right:20px;background:${esc(c)};color:#fff;padding:8px 16px;border-radius:100px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Now Booking</div>
            <div style="position:absolute;bottom:20px;left:20px;right:20px;background:rgba(9,9,9,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px 20px;display:flex;align-items:center;gap:14px">
              ${d.logo_url ? `<img src="${esc(d.logo_url)}" alt="" style="width:44px;height:44px;object-fit:contain;background:#fff;border-radius:8px;padding:5px" />` : ''}
              <div>
                <strong style="font-size:15px;display:block;margin-bottom:2px">${esc(d.dealership_name)}</strong>
                <span style="font-size:12px;color:#666">${heroCardOverlay}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  </section>

  <!-- TRUST -->
  <section style="padding:48px;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);background:#111">
    <div class="lp-trust-inner" style="max-width:1280px;margin:0 auto;display:flex;justify-content:center;gap:64px">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;border-radius:10px;background:${c}14;border:1px solid ${c}1f;display:flex;align-items:center;justify-content:center;font-size:18px">\u{1F6E1}\uFE0F</div>
        ${trustBadge1}
      </div>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;border-radius:10px;background:${c}14;border:1px solid ${c}1f;display:flex;align-items:center;justify-content:center;font-size:18px">\u23F1\uFE0F</div>
        ${trustBadge2}
      </div>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;border-radius:10px;background:${c}14;border:1px solid ${c}1f;display:flex;align-items:center;justify-content:center;font-size:18px">\u{1F4AC}</div>
        ${trustBadge3}
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section id="how" class="lp-section" style="padding:120px 48px;position:relative">
    <div style="max-width:1000px;margin:0 auto">
      <p class="lp-reveal" style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${esc(c)};margin-bottom:16px">Simple Process</p>
      <h2 class="fd lp-reveal lp-d1" style="font-size:clamp(32px,4vw,48px);font-weight:500;letter-spacing:-0.02em;margin-bottom:16px;line-height:1.1">How It Works</h2>
      <p class="lp-reveal lp-d2" style="font-size:16px;color:#A0A0A0;max-width:500px;margin-bottom:64px;font-weight:300;line-height:1.7">Three easy steps to secure your spot at ${esc(d.dealership_name)}.</p>
      <div class="lp-3col" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
        <div class="lp-reveal" style="padding:40px 32px;background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:16px">
          <div class="fd" style="font-size:48px;font-weight:400;color:${c}33;line-height:1;margin-bottom:20px">01</div>
          <h3 style="font-size:18px;font-weight:600;margin-bottom:10px">${step1Title}</h3>
          <p style="font-size:14px;color:#A0A0A0;line-height:1.7;font-weight:300">${step1Text}</p>
        </div>
        <div class="lp-reveal lp-d1" style="padding:40px 32px;background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:16px">
          <div class="fd" style="font-size:48px;font-weight:400;color:${c}33;line-height:1;margin-bottom:20px">02</div>
          <h3 style="font-size:18px;font-weight:600;margin-bottom:10px">${step2Title}</h3>
          <p style="font-size:14px;color:#A0A0A0;line-height:1.7;font-weight:300">${step2Text}</p>
        </div>
        <div class="lp-reveal lp-d2" style="padding:40px 32px;background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:16px">
          <div class="fd" style="font-size:48px;font-weight:400;color:${c}33;line-height:1;margin-bottom:20px">03</div>
          <h3 style="font-size:18px;font-weight:600;margin-bottom:10px">${step3Title}</h3>
          <p style="font-size:14px;color:#A0A0A0;line-height:1.7;font-weight:300">${step3Text}</p>
        </div>
      </div>
    </div>
  </section>

  ${middleSectionHTML}

  <!-- BOOKING FORM -->
  <section id="booking" class="lp-section" style="padding:120px 48px;position:relative">
    <div style="max-width:680px;margin:0 auto">
      <p class="lp-reveal" style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${esc(c)};margin-bottom:16px">Get Started</p>
      <h2 class="fd lp-reveal lp-d1" style="font-size:clamp(36px,5vw,56px);font-weight:500;letter-spacing:-0.02em;margin-bottom:16px;line-height:1.1;color:#FFFFFF">${bookingHeading}</h2>
      <p class="lp-reveal lp-d2" style="font-size:16px;color:#A0A0A0;max-width:500px;margin-bottom:64px;font-weight:300;line-height:1.7">Fill in your details and we'll handle the rest.</p>

      <form id="lp-form" class="lp-form-card lp-reveal lp-d3" onsubmit="handleSubmit(event)" style="background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:52px;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent 0%,${esc(c)} 50%,transparent 100%)"></div>

        <div class="lp-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">First Name</label>
            <input class="lp-input" type="text" name="first_name" placeholder="John" />
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Last Name</label>
            <input class="lp-input" type="text" name="last_name" placeholder="Smith" />
          </div>
        </div>
        <div class="lp-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Email</label>
            <input class="lp-input" type="email" name="email" placeholder="john@example.com" />
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Phone</label>
            <input class="lp-input" type="tel" name="phone" placeholder="(555) 000-0000" />
          </div>
        </div>
        <div style="margin-bottom:20px">
          <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">What can we help you with?</label>
          <select class="lp-input" name="service_type">
            ${serviceOptions}
          </select>
        </div>
        <div class="lp-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Preferred Date</label>
            <input class="lp-input" type="date" name="preferred_date" min="${todayMin}" onchange="handleDateChange(this)" />
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Preferred Time</label>
            <select class="lp-input" name="preferred_time">
              <option value="" disabled selected>Select a time</option>
              ${times.map(t => `<option>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="margin-bottom:20px">
          <label style="display:block;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Additional Details</label>
          <textarea class="lp-input" name="details" placeholder="${textareaPlaceholder}" style="min-height:100px;resize:vertical"></textarea>
        </div>

        ${smsConsentHTML}

        <button type="submit" id="submit-btn" style="margin-top:32px;width:100%;padding:22px;background:${esc(c)};color:#FFFFFF;border:none;border-radius:10px;font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;cursor:pointer;letter-spacing:0.05em;text-transform:uppercase;transition:all 0.3s ease;box-shadow:0 8px 30px ${c}33">
          ${submitLabel}
        </button>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px">
          <a href="/privacy-policy" style="font-size:12px;color:#333;text-decoration:none">Privacy Policy</a>
          <span style="color:#333;font-size:12px">|</span>
          <a href="/terms-and-conditions" style="font-size:12px;color:#333;text-decoration:none">Terms &amp; Conditions</a>
        </div>
      </form>
    </div>
  </section>

  <!-- DEALER INFO -->
  <section id="info" class="lp-section" style="padding:120px 48px;background:#111">
    <div class="lp-2col" style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start">
      <div>
        <p class="lp-reveal" style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${esc(c)};margin-bottom:16px">${infoSectionLabel}</p>
        <h2 class="fd lp-reveal lp-d1" style="font-size:clamp(32px,4vw,48px);font-weight:500;letter-spacing:-0.02em;margin-bottom:40px;line-height:1.1">${esc(d.dealership_name)}</h2>
        ${d.address_full ? `
          <div class="lp-reveal lp-d2" style="display:flex;gap:18px;align-items:flex-start;margin-bottom:32px">
            <div style="width:48px;height:48px;border-radius:12px;background:${c}0f;border:1px solid ${c}1a;display:flex;align-items:center;justify-content:center;font-size:20px">\u{1F4CD}</div>
            <div>
              <p style="font-size:11px;color:#333;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;font-weight:600">Address</p>
              <p style="font-size:16px;font-weight:500"><a href="${esc(d.maps_url || '#')}" target="_blank" rel="noopener" style="color:#E8E8E8;text-decoration:none">${esc(d.address_full)}</a></p>
            </div>
          </div>
        ` : ''}
        ${d.phone_sales ? `
          <div class="lp-reveal lp-d3" style="display:flex;gap:18px;align-items:flex-start;margin-bottom:32px">
            <div style="width:48px;height:48px;border-radius:12px;background:${c}0f;border:1px solid ${c}1a;display:flex;align-items:center;justify-content:center;font-size:20px">\u{1F4DE}</div>
            <div>
              <p style="font-size:11px;color:#333;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;font-weight:600">${phoneLabel}</p>
              <p style="font-size:16px;font-weight:500"><a href="tel:${d.phone_sales?.replace(/\D/g, '')}" style="color:#E8E8E8;text-decoration:none">${esc(d.phone_sales)}</a></p>
            </div>
          </div>
        ` : ''}
      </div>
      <div class="lp-reveal" style="background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:36px">
        <h3 class="fd" style="font-size:24px;font-weight:500;margin-bottom:24px">Working Hours</h3>
        ${hoursHTML}
      </div>
    </div>
  </section>

  ${footerHTML(d, year)}

  <!-- SUCCESS MODAL -->
  <div id="success-modal" onclick="if(event.target===this)closeModal()">
    <div style="background:#161616;border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:48px 44px 40px;max-width:420px;width:100%;text-align:center;animation:modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 32px 100px rgba(0,0,0,0.6);position:relative">
      <button onclick="closeModal()" style="position:absolute;top:18px;right:18px;background:none;border:none;color:#333;font-size:24px;cursor:pointer;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:8px">&times;</button>
      <div style="position:relative;width:72px;height:72px;margin:0 auto 28px">
        <div style="position:absolute;inset:-6px;border-radius:50%;border:1.5px solid #34D399;animation:ring 2s ease infinite"></div>
        <div style="width:72px;height:72px;border-radius:50%;background:rgba(52,211,153,0.15);border:1.5px solid #34D399;display:flex;align-items:center;justify-content:center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
      <h3 class="fd" style="font-size:28px;font-weight:500;margin-bottom:10px">You're All Set!</h3>
      <p style="color:#A0A0A0;font-size:14px;line-height:1.65;margin-bottom:24px;font-weight:300">Your appointment request has been submitted successfully.</p>
      <div style="display:flex;align-items:flex-start;gap:14px;background:${c}0d;border:1px solid ${c}1a;border-radius:12px;padding:16px 18px;text-align:left;margin-bottom:24px">
        <div style="width:40px;height:40px;border-radius:10px;background:${c}1a;display:flex;align-items:center;justify-content:center;color:${esc(c)};flex-shrink:0">\u{1F4AC}</div>
        <div>
          <strong style="display:block;font-size:13px;margin-bottom:3px">Check your phone</strong>
          <span style="font-size:12px;color:#666;line-height:1.5">You'll receive an SMS confirmation shortly with your appointment details.</span>
        </div>
      </div>
      <button onclick="closeModal()" style="background:${esc(c)};color:#fff;border:none;padding:14px 56px;border-radius:8px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer">Done</button>
    </div>
  </div>

  <script>
    function initReveal() {
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('lp-visible'); });
      }, {threshold: 0.1, rootMargin: '0px 0px -60px 0px'});
      document.querySelectorAll('.lp-reveal').forEach(function(el) { obs.observe(el); });
    }
    window.addEventListener('scroll', function() {
      var nav = document.getElementById('lp-nav');
      if (nav) nav.classList.toggle('lp-nav-scrolled', window.scrollY > 50);
    });
    ${dateChangeScript}
    function handleSubmit(e) {
      e.preventDefault();
      var btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.textContent = 'Submitting...';
      setTimeout(function() {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.textContent = '${submitLabel}';
        document.getElementById('success-modal').classList.add('active');
      }, 1500);
    }
    function closeModal() {
      document.getElementById('success-modal').classList.remove('active');
      document.getElementById('lp-form').reset();
    }
    initReveal();
  </script>
</body>
</html>`

  // ── PRIVACY POLICY ──
  const privacyHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  ${sharedHead(d, `Privacy Policy | ${esc(d.dealership_name)}`, c, cDark)}
  ${sharedStyles(c, cDark)}
</head>
<body>

  ${navHTML(d, c)}

  <div style="padding:140px 48px 100px;max-width:720px;margin:0 auto;animation:fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)">
    <a href="/" style="display:inline-flex;align-items:center;gap:8px;color:${esc(c)};text-decoration:none;font-size:13px;font-weight:500;margin-bottom:40px">&larr; Back to Home</a>
    <h1 class="fd" style="font-size:40px;font-weight:500;margin-bottom:8px;letter-spacing:-0.02em">Privacy Policy</h1>
    <p style="font-size:13px;color:#333;margin-bottom:48px">Effective Date: ${esc(d.privacy_effective_date || 'Sep 15, 2025')}</p>
    <div style="font-size:14px;color:#666;line-height:1.85;font-weight:300">
      <p style="margin-bottom:16px">At ${esc(d.legal_entity_name)} (operating at ${esc(d.subdomain)}.visquanta.com) we respect and value your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or engage with us in other ways.</p>
      <h2 style="font-size:18px;font-weight:600;margin:36px 0 12px;color:#E8E8E8">1. Information We Collect</h2>
      <p style="margin-bottom:16px"><strong style="color:#E8E8E8;font-weight:500">Personal Identification Information:</strong> Name, email address, phone number, and other similar contact data.</p>
      <p style="margin-bottom:16px"><strong style="color:#E8E8E8;font-weight:500">Technical Information:</strong> IP address, browser type, operating system, and browsing habits through cookies and similar technologies.</p>
      <h2 style="font-size:18px;font-weight:600;margin:36px 0 12px;color:#E8E8E8">2. How We Use Your Information</h2>
      <p style="margin-bottom:16px">We may use the information we collect to provide and maintain our services, improve user experience, process transactions, communicate with you, and comply with legal obligations.</p>
      <h2 style="font-size:18px;font-weight:600;margin:36px 0 12px;color:#E8E8E8">3. Information Sharing and Disclosure</h2>
      <p style="margin-bottom:16px">No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services is permitted. All other use case categories exclude text messaging originator opt-in data and consent.</p>
      <h2 style="font-size:18px;font-weight:600;margin:36px 0 12px;color:#E8E8E8">4. Data Security</h2>
      <p style="margin-bottom:16px">We are committed to protecting your personal information using industry-standard security measures.</p>
      <h2 style="font-size:18px;font-weight:600;margin:36px 0 12px;color:#E8E8E8">5. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at: ${d.phone_sales ? `<a href="tel:${d.phone_sales.replace(/\D/g, '')}" style="color:${esc(c)}">${esc(d.phone_sales)}</a>` : ''}${d.email ? ` or <a href="mailto:${esc(d.email)}" style="color:${esc(c)}">${esc(d.email)}</a>` : ''}. Website: ${esc(d.subdomain)}.visquanta.com</p>
    </div>
  </div>

  ${footerHTML(d, year)}
  ${revealScript(d)}
</body>
</html>`

  // ── TERMS AND CONDITIONS ──
  const termsHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  ${sharedHead(d, `Terms and Conditions | ${esc(d.dealership_name)}`, c, cDark)}
  ${sharedStyles(c, cDark)}
</head>
<body>

  ${navHTML(d, c)}

  <div style="padding:140px 48px 100px;max-width:720px;margin:0 auto;animation:fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)">
    <a href="/" style="display:inline-flex;align-items:center;gap:8px;color:${esc(c)};text-decoration:none;font-size:13px;font-weight:500;margin-bottom:40px">&larr; Back to Home</a>
    <h1 class="fd" style="font-size:40px;font-weight:500;margin-bottom:8px;letter-spacing:-0.02em">Terms and Conditions</h1>
    <p style="font-size:13px;color:#333;margin-bottom:48px">Effective Date: ${esc(d.terms_effective_date || 'Sep 15, 2025')}</p>
    <ol style="list-style:decimal;padding-left:20px;font-size:14px;color:#666;line-height:1.85;font-weight:300">
      <li style="margin-bottom:12px">This SMS program sends recurring automated appointment confirmations, service reminders, rescheduling notifications, and other account-related updates from ${esc(d.legal_entity_name)} ${d.dba_name ? `(DBA ${esc(d.dba_name)})` : ''} (website: ${esc(d.subdomain)}.visquanta.com) to customers who have opted in. No promotional or marketing messages are sent.</li>
      <li style="margin-bottom:12px">You can cancel at any time by replying STOP.</li>
      <li style="margin-bottom:12px">If you experience issues, reply HELP for assistance${d.phone_sms_help ? ` or call ${esc(d.phone_sms_help)}` : ''}${d.email ? ` or email ${esc(d.email)}` : ''}.</li>
      <li style="margin-bottom:12px">Carriers are not liable for delayed or undelivered messages.</li>
      <li style="margin-bottom:12px">Message frequency may vary. Msg &amp; data rates may apply.</li>
      <li style="margin-bottom:12px">For privacy-related inquiries, please refer to our <a href="/privacy-policy" style="color:${esc(c)}">Privacy Policy</a>.</li>
    </ol>
  </div>

  ${footerHTML(d, year)}
  ${revealScript(d)}
</body>
</html>`

  return [
    { file: 'index.html', data: indexHTML },
    { file: 'privacy-policy/index.html', data: privacyHTML },
    { file: 'terms-and-conditions/index.html', data: termsHTML },
  ]
}
