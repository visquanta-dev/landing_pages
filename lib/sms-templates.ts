/**
 * Generate all SMS/legal copy from just two fields.
 * The copy is ALWAYS the same - only the business names change.
 */
import { isTradingEducationBusiness } from './site-niche'

export function generateSmsTemplates(legalEntityName: string, dbaName: string, phoneHelp?: string, email?: string, businessType?: string) {
  const legal = legalEntityName
  const dba = dbaName
  const brandLabel = `${legal}${dba && dba !== legal ? ` (DBA ${dba})` : ''}`
  const normalizedType = (businessType || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const isCcw = normalizedType === 'ccw' || normalizedType.includes('concealed-carry') || normalizedType.includes('permit-assistance')
  const isTradingEducation = isTradingEducationBusiness(normalizedType)
  const messageTypes = isCcw
    ? 'permit application assistance updates, qualification reminders, training-course access notifications, appointment confirmations, and account-related service notifications'
    : isTradingEducation
    ? 'trading education updates, educational content notifications, member account updates, appointment confirmations, reminders, support follow-ups, and account-related service notifications'
    : 'appointment confirmations, booking confirmations, reminders, rescheduling updates, missed appointment follow-ups, and account-related service notifications'

  return {
    sms_consent_text: `By checking this optional SMS consent box and submitting this form, you agree to receive recurring customer care text messages from ${brandLabel}, including ${messageTypes}. Message frequency varies based on your requests and appointments. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe. Consent is not a condition of purchase. We will not share your SMS opt-in or consent status with third parties for purposes unrelated to providing these messaging services.`,

    sms_checkbox_label: `Optional: I agree to receive recurring customer care text messages from ${brandLabel} at the phone number provided. Message frequency varies. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe. Checking this box is not required to submit this form.`,

    sms_optin_response: `${legal}: You are subscribed to customer care text messages. Msg frequency varies. Msg & data rates may apply. Reply HELP for help or STOP to unsubscribe.`,

    sms_optout_response: `${legal}: You are unsubscribed from customer care text messages. No more messages will be sent. Reply START to resubscribe.`,

    sms_help_response: `${legal}: For help with customer care text messages${phoneHelp ? `, call ${phoneHelp}` : ''}${email ? ` or email ${email}` : ''}. Msg & data rates may apply. Msg frequency varies. Reply STOP to unsubscribe.`,
  }
}

/**
 * Generate derived fields from core dealer info
 */
export function generateDerivedFields(dealershipName: string, legalEntityName?: string, dbaName?: string) {
  const name = dealershipName
  const legal = legalEntityName || `${name} LLC`
  const dba = dbaName || name
  const subdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '')

  return {
    legal_entity_name: legal,
    dba_name: dba,
    subdomain,
    page_title: `Book Your Appointment | ${name}`,
    email: `contact@${subdomain}.visquanta.com`,
  }
}
