/**
 * Generate all SMS/legal copy from just two fields.
 * The copy is ALWAYS the same — only the business names change.
 */
export function generateSmsTemplates(legalEntityName: string, dbaName: string, phoneHelp?: string, email?: string) {
  const legal = legalEntityName
  const dba = dbaName

  return {
    sms_consent_text: `By providing your phone number, you consent to receive recurring text messages from ${legal}${dba && dba !== legal ? ` (DBA ${dba})` : ''}, including appointment confirmations, reminders, and account-related updates. Message frequency may vary. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe. Consent is not a condition of purchase. No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.`,

    sms_checkbox_label: `I agree to receive recurring text messages from ${legal}${dba && dba !== legal ? ` (DBA ${dba})` : ''}. Message frequency may vary. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe.`,

    sms_optin_response: `${legal}: You are subscribed to recurring automated messages. Message frequency may vary. Message and data rates may apply. Reply HELP for help. Reply STOP to unsubscribe.`,

    sms_optout_response: `${legal}: You are unsubscribed and will receive no further messages. Reply HELP for help.`,

    sms_help_response: `${legal}: For assistance${phoneHelp ? `, call ${phoneHelp}` : ''}${email ? ` or email ${email}` : ''}. Reply STOP to unsubscribe.`,
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
