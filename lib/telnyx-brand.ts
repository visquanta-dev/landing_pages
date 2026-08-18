import { httpsUrl } from './https-url'

export type BrandInput = {
  displayName: string
  companyName: string
  ein: string
  phone: string
  email: string
  website: string
  street: string
  city: string
  state: string
  postalCode: string
}

export function digitsOnly(value?: string | null) {
  return (value || '').replace(/\D/g, '')
}

export function toE164(value?: string | null) {
  const digits = digitsOnly(value)
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (value?.trim().startsWith('+') && digits.length >= 10) return `+${digits}`
  return ''
}

export function buildBrandPayload(input: BrandInput) {
  return {
    entityType: 'PRIVATE_PROFIT',
    displayName: input.displayName.trim(),
    companyName: input.companyName.trim(),
    ein: digitsOnly(input.ein),
    phone: toE164(input.phone),
    street: input.street.trim(),
    city: input.city.trim(),
    state: (input.state || '').trim().toUpperCase().slice(0, 2),
    postalCode: input.postalCode.trim(),
    country: 'US',
    email: input.email.trim(),
    website: httpsUrl(input.website),
    vertical: 'RETAIL',
  }
}
