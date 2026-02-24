import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role for dashboard mutations
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type Dealership = {
  id: string
  created_at: string
  updated_at: string
  is_active: boolean
  subdomain: string
  dealership_name: string
  legal_entity_name: string
  dba_name: string | null
  brand: string
  phone_sales: string | null
  phone_sms_help: string | null
  email: string | null
  address_line1: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  address_full: string | null
  hours: Record<string, string>
  logo_url: string | null
  primary_color: string
  hero_bg_image: string | null
  hero_card_image: string | null
  vehicles: Vehicle[]
  sms_consent_text: string | null
  sms_checkbox_label: string | null
  sms_optin_response: string | null
  sms_optout_response: string | null
  sms_help_response: string | null
  privacy_effective_date: string | null
  terms_effective_date: string | null
  page_title: string | null
  maps_url: string | null
}

export type Vehicle = {
  name: string
  type: string
  price: string
  image_url: string
}
