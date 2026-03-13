import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null

export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, key)
}

export type Dealership = {
  id: string
  created_at: string
  updated_at: string
  is_active: boolean
  business_type: 'dealership' | 'gym'
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
  services: GymService[]
  sms_consent_text: string | null
  sms_checkbox_label: string | null
  sms_optin_response: string | null
  sms_optout_response: string | null
  sms_help_response: string | null
  privacy_effective_date: string | null
  terms_effective_date: string | null
  page_title: string | null
  maps_url: string | null
  vercel_project_id: string | null
  vercel_deployment_url: string | null
  deployed_at: string | null
}

export type Vehicle = {
  name: string
  type: string
  price: string
  image_url: string
}

export type GymService = {
  name: string
  description: string
}
