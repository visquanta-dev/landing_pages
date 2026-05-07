export type TelnyxCampaignBrand = {
  brandId: string
  displayName?: string | null
  companyName?: string | null
  dbaName?: string | null
  subdomain?: string | null
  domain?: string | null
  website?: string | null
}

export type TelnyxCampaignPayload = {
  brandId: string
  _displayName: string
  usecase: 'LOW_VOLUME'
  subUsecases: ['DELIVERY_NOTIFICATION']
  vertical: 'RETAIL'
  subscriberHelp: true
  subscriberOptin: true
  subscriberOptout: true
  embeddedLink: false
  embeddedPhone: false
  numberPool: false
  ageGated: false
  directLending: false
  termsAndConditions: true
  termsAndConditionsLink: string
  privacyPolicyLink: string
  description: string
  messageFlow: string
  helpMessage: string
  optinKeywords: 'START'
  optinMessage: string
  optoutKeywords: 'STOP'
  optoutMessage: string
  helpKeywords: 'HELP'
  sample1: string
  sample2: string
  sample3: string
  sample4: string
}

function firstValue(...values: Array<string | null | undefined>) {
  return values.find(value => value && value.trim())?.trim() || ''
}

function hostname(value?: string | null) {
  const raw = value?.trim()
  if (!raw) return ''

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return raw.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')
  }
}

export function buildCampaign(brand: TelnyxCampaignBrand): TelnyxCampaignPayload {
  const legalName = firstValue(brand.companyName, brand.displayName, 'Business')
  const dba = firstValue(brand.dbaName, brand.displayName, legalName)
  const domain = brand.subdomain
    ? `${brand.subdomain}.visquanta.com`
    : firstValue(hostname(brand.domain), hostname(brand.website), 'visquanta.com')
  const brandLabel = dba && dba !== legalName ? `${legalName} (DBA ${dba})` : legalName
  const optInDisclosure = `By providing your phone number, you consent to receive recurring text messages from ${brandLabel}, including appointment confirmations, booking confirmations, reminders, rescheduling notifications, and account-related updates. Message frequency may vary. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe. Consent is not a condition of purchase. No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.`
  const checkboxLabel = `I agree to receive recurring text messages from ${brandLabel}. Message frequency may vary. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe.`
  const optInConfirmation = `${dba}: You are subscribed to recurring automated messages. Message frequency may vary. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe.`

  return {
    brandId: brand.brandId,
    _displayName: dba,
    usecase: 'LOW_VOLUME',
    subUsecases: ['DELIVERY_NOTIFICATION'],
    vertical: 'RETAIL',
    subscriberHelp: true,
    subscriberOptin: true,
    subscriberOptout: true,
    embeddedLink: false,
    embeddedPhone: false,
    numberPool: false,
    ageGated: false,
    directLending: false,
    termsAndConditions: true,
    termsAndConditionsLink: `https://${domain}/terms-and-conditions`,
    privacyPolicyLink: `https://${domain}/privacy-policy`,
    description: `${brandLabel} uses this campaign to send recurring automated SMS appointment confirmations, booking confirmations, reminders, rescheduling notifications, and account-related updates to customers who request appointments, bookings, consultations, or related services through https://${domain} or through an in-person intake process. Customers provide explicit consent by entering their mobile number and selecting an unchecked SMS consent checkbox before submitting the form. The consent language discloses message frequency, message and data rates, HELP and STOP instructions, and that consent is not a condition of purchase. No promotional or marketing messages are sent as part of this campaign. No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.`,
    messageFlow: `Customers visit https://${domain} or complete an in-person intake form to request an appointment, booking, consultation, or related service. During the request process, customers enter their mobile number and must select an unchecked SMS consent checkbox before submitting. The SMS consent disclosure shown immediately above the checkbox reads: "${optInDisclosure}" The opt-in checkbox label reads: "${checkboxLabel}" Links to the privacy policy and terms and conditions are available on the website. After form submission and consent, the customer receives this opt-in confirmation SMS: "${optInConfirmation}"`,
    helpMessage: `${dba}: For help, reply HELP and a team member will assist you. Message and data rates may apply. Reply STOP to unsubscribe.`,
    optinKeywords: 'START',
    optinMessage: optInConfirmation,
    optoutKeywords: 'STOP',
    optoutMessage: `${dba}: You are unsubscribed and will receive no further messages. Reply HELP for help.`,
    helpKeywords: 'HELP',
    sample1: `${dba}: Your appointment is confirmed for March 22 at 10:30 AM. Reply HELP for help or STOP to unsubscribe.`,
    sample2: `${dba}: Reminder: your booking is tomorrow at 11:00 AM. Reply HELP for help or STOP to unsubscribe.`,
    sample3: `${dba}: Your appointment has been rescheduled to July 20 at 11:00 AM. Reply HELP for help or STOP to unsubscribe.`,
    sample4: `${dba}: We missed you for your appointment today. Reply HELP for help or STOP to unsubscribe.`,
  }
}

export function stripInternalCampaignFields(campaign: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(campaign).filter(([key]) => !key.startsWith('_'))
  )
}
