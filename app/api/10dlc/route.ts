import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { stripInternalCampaignFields } from '@/lib/telnyx-10dlc'
import { buildBrandPayload, toE164 } from '@/lib/telnyx-brand'
import { httpsUrl } from '@/lib/https-url'

const TELNYX_API_KEY = process.env.TELNYX_API_KEY || ''
const TELNYX_BASE = 'https://api.telnyx.com/v2'

const telnyxHeaders = {
  'Authorization': `Bearer ${TELNYX_API_KEY}`,
  'Content-Type': 'application/json',
}

async function telnyxGet(path: string) {
  const res = await fetch(`${TELNYX_BASE}${path}`, { headers: telnyxHeaders, cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(JSON.stringify(data))
  }
  return data
}

async function telnyxPost(path: string, body: any) {
  const res = await fetch(`${TELNYX_BASE}${path}`, {
    method: 'POST',
    headers: telnyxHeaders,
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}

function telnyxRecords(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.records)) return data.data.records
  return []
}

function campaignId(data: any) {
  return data?.campaignId || data?.tcrCampaignId || data?.id || null
}

// Campaigns are listed at /10dlc/campaign. NOTE: /10dlc/campaignBuilder is
// POST-only (it CREATES a campaign) — GETting it returns Telnyx error 10005
// "Resource not found", which previously caused the pre-create dedup check to
// throw and the bulk-create flow to report 10005 without ever creating anything.
async function listAllCampaigns() {
  const res = await telnyxGet('/10dlc/campaign?page=1&recordsPerPage=500')
  return telnyxRecords(res)
}

async function listCampaignsForBrand(brandId: string) {
  if (!brandId) return []
  const res = await telnyxGet(`/10dlc/campaign?brandId=${encodeURIComponent(brandId)}&recordsPerPage=50`)
  return telnyxRecords(res).filter(c => !c.brandId || c.brandId === brandId)
}

// GET — fetch brands + dealership data merged
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')

  try {
    if (action === 'brands') {
      // Fetch all Telnyx brands
      const allBrands: any[] = []
      let page = 1
      while (true) {
        const res = await telnyxGet(`/10dlc/brand?page=${page}&recordsPerPage=50`)
        if (res.records) allBrands.push(...res.records)
        if (!res.records || res.records.length < 50) break
        page++
      }

      let campaignCounts = new Map<string, number>()
      let latestCampaignByBrand = new Map<string, any>()
      try {
        const campaigns = await listAllCampaigns()
        for (const campaign of campaigns) {
          if (!campaign.brandId) continue
          campaignCounts.set(campaign.brandId, (campaignCounts.get(campaign.brandId) || 0) + 1)
          latestCampaignByBrand.set(campaign.brandId, campaign)
        }
      } catch {
        // Fall back to Telnyx brand assignedCampaignsCount if campaignBuilder listing is unavailable.
      }

      // Fetch dealership data from Supabase
      let dealerships: any[] = []
      try {
        const supabase = createServiceClient()
        const { data } = await supabase
          .from('dealerships')
          .select('dealership_name, legal_entity_name, dba_name, phone_sales, email, brand_email, subdomain, address_city, address_state, business_type, telnyx_brand_id, telnyx_phone_number, messaging_profile_id, ein, source_website')
        dealerships = data || []
      } catch {
        // Supabase might not be configured, continue without it
      }

      // Merge: match by legal entity name (normalized)
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
      const dealerMap = new Map<string, any>()
      for (const d of dealerships) {
        if (d.legal_entity_name) dealerMap.set(normalize(d.legal_entity_name), d)
      }

      const merged = allBrands.map(brand => {
        const dealer = dealerMap.get(normalize(brand.companyName))
        const builderCount = campaignCounts.get(brand.brandId) || 0
        const latestCampaign = latestCampaignByBrand.get(brand.brandId)
        return {
          ...brand,
          assignedCampaignsCount: Math.max(Number(brand.assignedCampaignsCount || 0), builderCount),
          campaignId: latestCampaign ? campaignId(latestCampaign) : null,
          campaignStatus: latestCampaign?.campaignStatus || latestCampaign?.status || null,
          submissionStatus: latestCampaign?.submissionStatus || null,
          // Supabase data
          phone: dealer?.phone_sales || null,
          contactEmail: dealer?.brand_email || dealer?.email || null,
          storedBrandId: dealer?.telnyx_brand_id || null,
          telnyxPhoneNumber: dealer?.telnyx_phone_number || null,
          messagingProfileId: dealer?.messaging_profile_id || null,
          subdomain: dealer?.subdomain || null,
          domain: dealer?.subdomain ? `${dealer.subdomain}.visquanta.com` : (brand.website ? new URL(brand.website).hostname : null),
          city: dealer?.address_city || null,
          state: dealer?.address_state || null,
          dbaName: dealer?.dba_name || brand.displayName,
          businessType: dealer?.business_type || null,
        }
      })

      return NextResponse.json(merged)
    }

    if (action === 'campaigns') {
      const brandId = req.nextUrl.searchParams.get('brandId')
      if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })
      const records = await listCampaignsForBrand(brandId)
      return NextResponse.json({ page: 1, records, totalRecords: records.length, source: 'campaign' })
    }

    return NextResponse.json({ error: 'action param required (brands, campaigns)' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST — create campaigns
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, ...payload } = body

    if (action === 'create_campaign') {
      const campaign = stripInternalCampaignFields(payload.campaign)
      const existing = await listCampaignsForBrand(String(campaign.brandId || ''))
      if (existing.length > 0) {
        return NextResponse.json({ alreadyExists: true, ...existing[0] })
      }
      const result = await telnyxPost('/10dlc/campaignBuilder', campaign)
      if (result.status >= 400) {
        return NextResponse.json({ error: result.data }, { status: result.status })
      }
      if (!campaignId(result.data)) {
        return NextResponse.json({ error: 'Telnyx did not return a campaignId', details: result.data }, { status: 502 })
      }
      return NextResponse.json(result.data)
    }

    if (action === 'create_campaigns_bulk') {
      const { campaigns } = payload
      const results: any[] = []

      for (const campaign of campaigns) {
        const displayName = campaign._displayName
        try {
          const telnyxCampaign = stripInternalCampaignFields(campaign)
          const existing = await listCampaignsForBrand(String(campaign.brandId || ''))
          if (existing.length > 0) {
            results.push({
              brandId: campaign.brandId,
              displayName,
              success: true,
              data: { alreadyExists: true, ...existing[0] },
              error: null,
            })
            continue
          }

          const result = await telnyxPost('/10dlc/campaignBuilder', telnyxCampaign)
          const createdCampaignId = campaignId(result.data)
          results.push({
            brandId: campaign.brandId,
            displayName,
            success: result.status < 400 && Boolean(createdCampaignId),
            data: result.data,
            error: result.status >= 400 ? result.data : createdCampaignId ? null : 'Telnyx did not return a campaignId',
          })
        } catch (e: any) {
          results.push({
            brandId: campaign.brandId,
            displayName,
            success: false,
            error: e.message,
          })
        }
        // Delay between calls to avoid rate limiting
        await new Promise(r => setTimeout(r, 800))
      }

      return NextResponse.json({ results })
    }

    if (action === 'create_brand') {
      return NextResponse.json(await createBrandAndNumber(payload))
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function createBrandAndNumber(payload: any) {
  const subdomain = String(payload.subdomain || '').trim()
  if (!subdomain) throw new Error('subdomain required')

  const supabase = createServiceClient()
  const { data: dealer, error } = await supabase
    .from('dealerships')
    .select('*')
    .eq('subdomain', subdomain)
    .single()
  if (error || !dealer) throw new Error(`Dealer not found: ${subdomain}`)

  const existingBrandId = String(payload.existingBrandId || dealer.telnyx_brand_id || '').trim()
  const ein = String(payload.ein || dealer.ein || '').replace(/\D/g, '')
  let brandId = existingBrandId
  let brandCreated = false

  if (!brandId) {
    if (ein.length !== 9) throw new Error('EIN is required to create a brand. Paste it from the onboarding survey.')
    const brandPayload = buildBrandPayload({
      displayName: dealer.dba_name || dealer.dealership_name,
      companyName: dealer.legal_entity_name || dealer.dealership_name,
      ein,
      phone: dealer.phone_sales,
      email: payload.brandEmail || dealer.brand_email || dealer.email,
      website: dealer.source_website || payload.sourceWebsite,
      street: dealer.address_line1,
      city: dealer.address_city,
      state: dealer.address_state,
      postalCode: dealer.address_zip,
    })
    if (!brandPayload.website) throw new Error('Brand website is required and must be https://')
    if (!brandPayload.email) throw new Error('Brand email is required (use the address from onboarding / scrape).')
    if (!brandPayload.phone) throw new Error('Brand phone is required.')

    const created = await telnyxPost('/10dlc/brand', brandPayload)
    if (created.status >= 400) {
      throw new Error(JSON.stringify(created.data))
    }
    brandId = created.data?.brandId || created.data?.data?.brandId || created.data?.id
    if (!brandId) throw new Error('Telnyx did not return a brandId')
    brandCreated = true
  }

  let phoneNumber = dealer.telnyx_phone_number || null
  let messagingProfileId = dealer.messaging_profile_id || null
  let numberNote = ''

  if (payload.buyNumber !== false && !phoneNumber) {
    const city = String(dealer.address_city || '').trim()
    const state = String(dealer.address_state || '').trim().toUpperCase().slice(0, 2)
    const local = await searchLocalNumbers(city, state)
    if (local.length === 0) {
      numberNote = `No local numbers in ${city || 'that city'}${state ? `, ${state}` : ''}. Ask before buying a number from somewhere else.`
    } else {
      const chosen = local[0]
      const profile = await telnyxPost('/messaging_profiles', {
        name: dealer.dba_name || dealer.dealership_name,
        webhook_url: 'https://portal.visquanta.com/api/sms/inbound',
        webhook_failover_url: '',
        whitelisted_destinations: ['US', 'CA'],
      })
      if (profile.status >= 400) {
        throw new Error(JSON.stringify(profile.data))
      }
      messagingProfileId = profile.data?.data?.id || profile.data?.id
      const order = await telnyxPost('/number_orders', {
        phone_numbers: [{ phone_number: chosen.phone_number }],
        messaging_profile_id: messagingProfileId,
      })
      if (order.status >= 400) {
        throw new Error(JSON.stringify(order.data))
      }
      phoneNumber = chosen.phone_number
    }
  }

  const updates: Record<string, string | null> = {
    telnyx_brand_id: brandId,
  }
  if (ein) updates.ein = ein
  if (payload.brandEmail || dealer.brand_email) updates.brand_email = payload.brandEmail || dealer.brand_email
  if (payload.sourceWebsite || dealer.source_website) updates.source_website = httpsUrl(payload.sourceWebsite || dealer.source_website)
  if (phoneNumber) updates.telnyx_phone_number = phoneNumber
  if (messagingProfileId) updates.messaging_profile_id = messagingProfileId

  const { error: updateError } = await supabase
    .from('dealerships')
    .update(updates)
    .eq('id', dealer.id)
  if (updateError) {
    throw new Error(`Brand created but row write-back failed: ${updateError.message}`)
  }

  return {
    success: true,
    brandCreated,
    brandId,
    phoneNumber,
    messagingProfileId,
    needsNumberChoice: Boolean(numberNote),
    numberNote,
  }
}

async function searchLocalNumbers(city: string, state: string) {
  if (!city) return []
  const params = new URLSearchParams({
    'filter[country_code]': 'US',
    'filter[limit]': '5',
    'filter[features]': 'sms',
    'filter[locality]': city,
  })
  if (state) params.set('filter[administrative_area]', state)
  try {
    const data = await telnyxGet(`/available_numbers?${params.toString()}`)
    return (data?.data || []).map((row: any) => ({
      phone_number: row.phone_number || row.phoneNumber,
      locality: row.locality,
      administrative_area: row.administrative_area,
    })).filter((row: any) => row.phone_number)
  } catch {
    return []
  }
}
