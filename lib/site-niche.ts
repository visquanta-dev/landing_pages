export type ServiceItem = {
  name: string
  description: string
}

export const BUSINESS_TYPE_OPTIONS = [
  { value: 'dealership', label: 'Dealership' },
  { value: 'trade-in-signals', label: 'Trade-In Signals' },
  { value: 'gym', label: 'Gym / Fitness Center' },
  { value: 'insurance', label: 'Insurance Agency' },
  { value: 'ccw', label: 'CCW / Permit Assistance' },
  { value: 'solar', label: 'Solar / Energy' },
  { value: 'disability', label: 'Disability Services' },
  { value: 'travel', label: 'Travel / Tickets' },
  { value: 'professional', label: 'Professional Services' },
]

export function normalizeBusinessType(value?: string | null) {
  return (value || 'dealership').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dealership'
}

export function businessTypeLabel(value?: string | null) {
  const raw = (value || '').trim()
  const normalized = normalizeBusinessType(raw)
  const known = BUSINESS_TYPE_OPTIONS.find(option => option.value === normalized)
  if (known) return known.label
  if (!raw) return 'Dealership'
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function isKnownDealership(value?: string | null) {
  return normalizeBusinessType(value) === 'dealership'
}

export function isInsuranceBusiness(value?: string | null) {
  return normalizeBusinessType(value) === 'insurance'
}

export function isGymBusiness(value?: string | null) {
  return normalizeBusinessType(value) === 'gym'
}

export function isCcwBusiness(value?: string | null) {
  const type = normalizeBusinessType(value)
  return type === 'ccw' || type.includes('concealed-carry') || type.includes('permit-assistance')
}

export function isTradeInSignalsBusiness(value?: string | null) {
  const type = normalizeBusinessType(value)
  return type === 'trade-in-signals' || type === 'trade-signals' || type === 'vehicle-equity-signals'
}

export function isServiceBusiness(value?: string | null) {
  const type = normalizeBusinessType(value)
  return type !== 'dealership' && type !== 'insurance'
}

export function defaultServicesForBusinessType(value?: string | null): ServiceItem[] {
  const type = normalizeBusinessType(value)
  if (isCcwBusiness(type)) {
    return [
      { name: 'Permit Eligibility Pre-Check', description: 'Answer a few questions so the team can understand your application needs and next steps.' },
      { name: 'Application Assistance', description: 'Get guided support with the concealed carry permit application process and required details.' },
      { name: 'Firearms Safety Course Access', description: 'Proceed to firearms safety training resources and application support after pre-qualification.' },
    ]
  }
  if (isTradeInSignalsBusiness(type)) {
    return [
      { name: 'Trade-In Valuation', description: 'Request an estimated vehicle value and the next step for review.' },
      { name: 'Equity Review', description: 'Check whether your current vehicle may have usable equity or upgrade potential.' },
      { name: 'Upgrade Opportunity', description: 'Share your vehicle details so the team can identify relevant trade or upgrade options.' },
    ]
  }
  if (type.includes('solar') || type.includes('energy')) {
    return [
      { name: 'Solar Consultation', description: 'Review your property, energy goals, and available solar options.' },
      { name: 'Panel Installation', description: 'Plan a solar panel system designed around your home or business.' },
      { name: 'Battery Storage', description: 'Explore backup power and battery storage options for greater control.' },
    ]
  }
  if (type.includes('disability')) {
    return [
      { name: 'Eligibility Consultation', description: 'Discuss your situation and understand the next steps available to you.' },
      { name: 'Claim Support', description: 'Get help preparing information and coordinating your claim review.' },
      { name: 'Appointment Follow-up', description: 'Schedule follow-up support and receive timely appointment reminders.' },
    ]
  }
  if (type.includes('travel') || type.includes('ticket')) {
    return [
      { name: 'Flights', description: 'Find flight options for your destination, schedule, and budget.' },
      { name: 'Holiday Packages', description: 'Compare bundled travel options including flights, hotels, and extras.' },
      { name: 'Custom Trips', description: 'Plan multi-stop trips, group bookings, or special travel requests.' },
    ]
  }
  return [
    { name: 'Consultation', description: 'Tell us what you need and we will coordinate the right next step.' },
    { name: 'Appointment Booking', description: 'Request a convenient time and receive confirmation by SMS.' },
    { name: 'Customer Support', description: 'Get help with questions, updates, and follow-up requests.' },
  ]
}

export function inferBusinessTypeFromText(text: string) {
  const haystack = text.toLowerCase()

  if (/\b(trade[-\s]?in signals?|trade signals?|vehicle equity signals?|equity signals?)\b/.test(haystack)) return 'trade-in-signals'

  // Dealership is checked first because car-dealer pages routinely use generic
  // insurance-adjacent words ("warranty coverage", "request a quote", "premium trim")
  // that would otherwise false-positive into the insurance branch.
  const dealerBrand = /\b(toyota|ford|chevrolet|chevy|honda|hyundai|kia|nissan|volkswagen|vw|subaru|mazda|bmw|mercedes|mercedes-benz|audi|jeep|ram|dodge|chrysler|gmc|lexus|acura|buick|cadillac|lincoln|mitsubishi|volvo|porsche|jaguar|land rover|range rover|tesla|genesis|infiniti|fiat|alfa romeo|maserati|bentley|rolls-royce|aston martin|mclaren|lamborghini|ferrari|polestar|rivian|lucid)\b/
  const dealerSignal = /\b(dealer|dealers|dealership|dealerships|vehicle|vehicles|inventory|test drive|test-drive|new cars|used cars|pre-owned|preowned|certified pre-owned|cpo|service department|parts department|trade.in|finance department|auto group|motors|automotive)\b/
  if (dealerBrand.test(haystack) || dealerSignal.test(haystack)) return 'dealership'

  if (/\b(ccw|concealed carry|conceal carry|concealed handgun|firearms safety|gun laws|permit holder|permit holders|new hampshire application|state acceptance)\b/.test(haystack)) return 'ccw'
  if (/\b(solar|photovoltaic|battery storage|renewable energy|energy bill|ev charger)\b/.test(haystack)) return 'solar'
  if (/\b(disability|social security|ssi|ssdi|disability benefits|disability claim|disability appeal)\b/.test(haystack)) return 'disability'

  // Insurance: require an unambiguous insurance noun. "coverage/quote/premium/deductible"
  // alone are too generic — they appear on dealer, gym, and travel pages.
  if (/\b(insurance agency|insurance agent|insurance broker|auto insurance|home insurance|life insurance|health insurance|insurance policy|insurance quote|insurance coverage|insurance premium|homeowners insurance|renters insurance|umbrella policy)\b/.test(haystack)) return 'insurance'

  if (/\b(gym|fitness|pilates|yoga|crossfit|workout|gym membership|fitness membership|personal training)\b/.test(haystack)) return 'gym'
  if (/\b(flight|flights|holiday package|vacation package|cruise|hotel booking|travel agency|airfare)\b/.test(haystack)) return 'travel'
  return 'professional'
}
