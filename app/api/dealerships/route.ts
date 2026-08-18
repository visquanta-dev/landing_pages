import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const DEALERSHIP_WRITE_COLUMNS = new Set([
  'is_active', 'business_type', 'subdomain', 'dealership_name', 'legal_entity_name',
  'dba_name', 'brand', 'phone_sales', 'phone_sms_help', 'email', 'address_line1',
  'address_city', 'address_state', 'address_zip', 'address_full', 'hours', 'logo_url',
  'primary_color', 'hero_bg_image', 'hero_card_image', 'vehicles', 'services',
  'insurance_products', 'sms_consent_text', 'sms_checkbox_label', 'sms_optin_response',
  'sms_optout_response', 'sms_help_response', 'privacy_effective_date', 'terms_effective_date',
  'page_title', 'maps_url', 'vercel_project_id', 'vercel_deployment_url', 'deployed_at',
  'ein', 'brand_email', 'source_website', 'telnyx_campaign_id', 'telnyx_phone_number',
  'messaging_profile_id',
])

function pickDealershipWrite(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(body || {})) {
    if (DEALERSHIP_WRITE_COLUMNS.has(key)) out[key] = value
  }
  return out
}

export async function GET() {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const { data, error } = await supabase
    .from('dealerships')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const body = pickDealershipWrite(await req.json())
  
  const { data, error } = await supabase
    .from('dealerships')
    .insert(body)
    .select()
    .single()
  
  if (error && error.code === '23505' && body?.subdomain) {
    const updates = pickDealershipWrite(body)
    const { data: existing, error: updateError } = await supabase
      .from('dealerships')
      .update(updates)
      .eq('subdomain', body.subdomain)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json(existing)
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const body = await req.json()
  const { id } = body
  const updates = pickDealershipWrite(body)
  
  const { data, error } = await supabase
    .from('dealerships')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const { id } = await req.json()
  
  const { error } = await supabase
    .from('dealerships')
    .delete()
    .eq('id', id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
