import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const TELNYX_API_KEY = process.env.TELNYX_API_KEY || ''
const TELNYX_BASE = 'https://api.telnyx.com/v2'

const telnyxHeaders = {
  'Authorization': `Bearer ${TELNYX_API_KEY}`,
  'Content-Type': 'application/json',
}

async function telnyxGet(path: string) {
  const res = await fetch(`${TELNYX_BASE}${path}`, { headers: telnyxHeaders, cache: 'no-store' })
  return res.json()
}

async function telnyxPost(path: string, body: any) {
  const res = await fetch(`${TELNYX_BASE}${path}`, {
    method: 'POST',
    headers: telnyxHeaders,
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
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

      // Fetch dealership data from Supabase
      let dealerships: any[] = []
      try {
        const supabase = createServiceClient()
        const { data } = await supabase
          .from('dealerships')
          .select('dealership_name, legal_entity_name, dba_name, phone_sales, email, subdomain, address_city, address_state')
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
        return {
          ...brand,
          // Supabase data
          phone: dealer?.phone_sales || null,
          contactEmail: dealer?.email || null,
          subdomain: dealer?.subdomain || null,
          domain: dealer?.subdomain ? `${dealer.subdomain}.visquanta.com` : (brand.website ? new URL(brand.website).hostname : null),
          city: dealer?.address_city || null,
          state: dealer?.address_state || null,
          dbaName: dealer?.dba_name || brand.displayName,
        }
      })

      return NextResponse.json(merged)
    }

    if (action === 'campaigns') {
      const brandId = req.nextUrl.searchParams.get('brandId')
      if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })
      const res = await telnyxGet(`/10dlc/campaign?brandId=${brandId}`)
      return NextResponse.json(res)
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
      const result = await telnyxPost('/10dlc/campaignBuilder', payload.campaign)
      if (result.status >= 400) {
        return NextResponse.json({ error: result.data }, { status: result.status })
      }
      return NextResponse.json(result.data)
    }

    if (action === 'create_campaigns_bulk') {
      const { campaigns } = payload
      const results: any[] = []

      for (const campaign of campaigns) {
        try {
          const result = await telnyxPost('/10dlc/campaignBuilder', campaign)
          results.push({
            brandId: campaign.brandId,
            displayName: campaign._displayName,
            success: result.status < 400,
            data: result.data,
            error: result.status >= 400 ? result.data : null,
          })
        } catch (e: any) {
          results.push({
            brandId: campaign.brandId,
            displayName: campaign._displayName,
            success: false,
            error: e.message,
          })
        }
        // Delay between calls to avoid rate limiting
        await new Promise(r => setTimeout(r, 800))
      }

      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
