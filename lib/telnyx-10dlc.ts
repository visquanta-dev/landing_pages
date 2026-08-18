import { customerCareMessageTypes, isCcwBusiness, isDryCleanerBusiness, isTradingEducationBusiness } from './site-niche'
import { httpsUrl } from './https-url'

export type TelnyxCampaignBrand = {
  brandId: string
  displayName?: string | null
  companyName?: string | null
  dbaName?: string | null
  phone?: string | null
  contactEmail?: string | null
  email?: string | null
  subdomain?: string | null
  domain?: string | null
  website?: string | null
  businessType?: string | null
  privacyPolicyUrl?: string | null
  termsUrl?: string | null
}

function isCcwBusinessType(value?: string | null) {
  return isCcwBusiness(value)
}

function isTradingEducationBusinessType(value?: string | null) {
  return isTradingEducationBusiness(value)
}

function isDryCleanerBusinessType(value?: string | null) {
  return isDryCleanerBusiness(value)
}

export type TelnyxCampaignPayload = {
  brandId: string
  _displayName: string
  usecase: 'LOW_VOLUME'
  subUsecases: ['CUSTOMER_CARE']
  vertical: 'RETAIL'
  subscriberHelp: true
  subscriberOptin: true
  subscriberOptout: true
  embeddedLink: false
  embeddedPhone: false
  numberPool: false
  ageGated: boolean
  directLending: false
  termsAndConditions: true
  termsAndConditionsLink: string
  privacyPolicyLink: string
  description: string
  messageFlow: string
  helpMessage: string
  optinKeywords: string
  optinMessage: string
  optoutKeywords: string
  optoutMessage: string
  helpKeywords: string
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
  const bookingUrl = httpsUrl(domain)
  const generatedPrivacy = httpsUrl(`${domain}/privacy-policy`)
  const generatedTerms = httpsUrl(`${domain}/terms-and-conditions`)
  const privacyUrl = httpsUrl(brand.privacyPolicyUrl) || generatedPrivacy
  const termsUrl = httpsUrl(brand.termsUrl) || generatedTerms
  const helpContact = firstValue(brand.phone, brand.contactEmail, brand.email, privacyUrl)
  const isCcw = isCcwBusinessType(brand.businessType)
  const isTradingEducation = isTradingEducationBusinessType(brand.businessType)
  const isDryCleaner = isDryCleanerBusinessType(brand.businessType)
  const messageTypes = customerCareMessageTypes(brand.businessType)
  const serviceRequestNoun = isDryCleaner
    ? 'pickup, drop-off, delivery, or garment-care requests'
    : 'appointments, bookings, consultations, or related services'
  const optInDisclosure = `By checking this optional SMS consent box and submitting this form, you agree to receive recurring customer care text messages from ${brandLabel}, including ${messageTypes}. Message frequency varies based on your requests and appointments. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe. Consent is not a condition of purchase. We will not share your SMS opt-in or consent status with third parties for purposes unrelated to providing these messaging services.`
  const checkboxLabel = `I agree to receive recurring customer care text messages from ${brandLabel} at the phone number provided. Message frequency varies. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe. Checking this box is not required to submit this form.`
  const optInConfirmation = `${dba}: You are subscribed to customer care text messages. Msg frequency varies. Msg & data rates may apply. Reply HELP for help or STOP to unsubscribe.`
  const ccwAgeGateDescription = isCcw
    ? ' Because the website references CCW permits and firearms-related services, the website is age gated. Visitors must enter their date of birth in a birthdate age-verification gate before accessing the site, and the request form also requires a date of birth. The page calculates whether the visitor is at least 21 years old; a binary self-certification button is not used.'
    : ''

  return {
    brandId: brand.brandId,
    _displayName: dba,
    usecase: 'LOW_VOLUME',
    subUsecases: ['CUSTOMER_CARE'],
    vertical: 'RETAIL',
    subscriberHelp: true,
    subscriberOptin: true,
    subscriberOptout: true,
    embeddedLink: false,
    embeddedPhone: false,
    numberPool: false,
    ageGated: isCcw,
    directLending: false,
    termsAndConditions: true,
    termsAndConditionsLink: termsUrl,
    privacyPolicyLink: privacyUrl,
    description: `${brandLabel} uses this low-volume customer care campaign to send non-marketing SMS ${messageTypes} to customers who request ${serviceRequestNoun} through ${bookingUrl}.${ccwAgeGateDescription} Customers provide explicit SMS consent only by entering their mobile number and selecting a separate, unchecked, optional SMS consent checkbox before submitting the website form. The form also requires two separate legal confirmations (Terms & Conditions acceptance and Privacy Policy acceptance) that are not bundled with SMS consent. The campaign does not send promotional or marketing messages. The website includes accessible Privacy Policy and Terms & Conditions links, and the privacy policy states that SMS opt-in and consent data is not shared for purposes unrelated to providing the messaging service.`,
    messageFlow: `Digital opt-in is collected at ${bookingUrl}.${ccwAgeGateDescription} A customer navigates to the booking/request form, enters their name, mobile phone number, and requested ${isDryCleaner ? 'pickup, drop-off, or garment-care' : 'appointment or service'} details. Before submit, the customer must check two required legal confirmations that are separate from SMS: (1) "I have read and agree to the Terms & Conditions" linking to ${termsUrl}, and (2) "I have read and agree to the Privacy Policy" linking to ${privacyUrl}. After those required confirmations, the customer can optionally opt in to SMS by selecting a separate SMS consent checkbox. The SMS checkbox is unchecked by default, optional, and not bundled with the Terms or Privacy confirmations. The SMS consent disclosure shown immediately above the SMS checkbox reads: "${optInDisclosure}" The SMS checkbox label reads: "${checkboxLabel}" The form also displays direct Privacy Policy and Terms & Conditions links beside the consent disclosure: ${privacyUrl} and ${termsUrl}. After submitting the form with the SMS checkbox selected, the customer receives this confirmation SMS: "${optInConfirmation}" Customers who do not select the SMS checkbox can still submit the form (if the required Terms and Privacy boxes are checked) and are not sent SMS messages. Customers can opt out at any time by replying STOP.`,
    helpMessage: `${dba}: For help with customer care text messages, contact ${helpContact}. Msg & data rates may apply. Msg frequency varies. Reply STOP to unsubscribe.`,
    optinKeywords: 'START,YES,SUBSCRIBE',
    optinMessage: optInConfirmation,
    optoutKeywords: 'STOP,UNSUBSCRIBE,CANCEL,QUIT',
    optoutMessage: `${dba}: You are unsubscribed from customer care text messages. No more messages will be sent. Reply START to resubscribe.`,
    helpKeywords: 'HELP,INFO',
    sample1: isDryCleaner
      ? `${dba}: Hi Alex, your pickup is confirmed for Tue, Mar 22 at 10:30 AM. Reply HELP for help or STOP to unsubscribe.`
      : isTradingEducation
      ? `${dba}: Hi Alex, your education consultation request is confirmed for Tue, Mar 22 at 10:30 AM. Reply HELP for help or STOP to unsubscribe.`
      : `${dba}: Hi Alex, your appointment request is confirmed for Tue, Mar 22 at 10:30 AM. Reply HELP for help or STOP to unsubscribe.`,
    sample2: isDryCleaner
      ? `${dba}: Reminder for Jordan: we will collect your garments tomorrow at 11:00 AM. Reply CONFIRM to confirm, HELP for help, or STOP to unsubscribe.`
      : isTradingEducation
      ? `${dba}: Reminder for Jordan: your trading education booking is tomorrow at 11:00 AM. Reply CONFIRM to confirm, HELP for help, or STOP to unsubscribe.`
      : `${dba}: Reminder for Jordan: your booking is tomorrow at 11:00 AM. Reply CONFIRM to confirm, HELP for help, or STOP to unsubscribe.`,
    sample3: isDryCleaner
      ? `${dba}: Your order is ready for pickup. We can also deliver if you prefer. Reply HELP for help or STOP to unsubscribe.`
      : isTradingEducation
      ? `${dba}: Your member support call has been rescheduled to Thu, Jul 20 at 11:00 AM. Reply HELP for help or STOP to unsubscribe.`
      : `${dba}: Your appointment has been rescheduled to Thu, Jul 20 at 11:00 AM. Reply HELP for help or STOP to unsubscribe.`,
    sample4: isDryCleaner
      ? `${dba}: We missed today's pickup. Reply HELP to reschedule with our team or STOP to unsubscribe.`
      : isTradingEducation
      ? `${dba}: We missed you for today's education consultation. Reply HELP to reschedule with our team or STOP to unsubscribe.`
      : `${dba}: We missed you for today's appointment. Reply HELP to reschedule with our team or STOP to unsubscribe.`,
  }
}

export function stripInternalCampaignFields(campaign: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(campaign).filter(([key]) => !key.startsWith('_'))
  )
}
