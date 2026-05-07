export type ServiceItem = {
  name: string
  description: string
}

export const BUSINESS_TYPE_OPTIONS = [
  { value: 'dealership', label: 'Dealership' },
  { value: 'gym', label: 'Gym / Fitness Center' },
  { value: 'insurance', label: 'Insurance Agency' },
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

export function isServiceBusiness(value?: string | null) {
  const type = normalizeBusinessType(value)
  return type !== 'dealership' && type !== 'insurance'
}

export function defaultServicesForBusinessType(value?: string | null): ServiceItem[] {
  const type = normalizeBusinessType(value)
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
  if (/\b(solar|panel|panels|photovoltaic|battery storage|renewable energy|energy bill|ev charger)\b/.test(haystack)) return 'solar'
  if (/\b(disability|social security|ssi|ssdi|benefits|claim|claims|appeal)\b/.test(haystack)) return 'disability'
  if (/\b(insurance|policy|coverage|quote|premium|deductible)\b/.test(haystack)) return 'insurance'
  if (/\b(gym|fitness|pilates|yoga|training|workout|membership)\b/.test(haystack)) return 'gym'
  if (/\b(flight|flights|holiday|vacation|travel|tickets|cruise|hotel)\b/.test(haystack)) return 'travel'
  if (/\b(toyota|ford|chevrolet|honda|hyundai|kia|nissan|dealership|inventory|test drive|used cars|new cars)\b/.test(haystack)) return 'dealership'
  return 'professional'
}
