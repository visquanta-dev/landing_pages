import { NextRequest, NextResponse } from 'next/server'

const VERCEL_TOKEN = process.env.VQ_VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID // optional, for team accounts

function headers() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function teamParam() {
  return VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
}

// POST — Add a subdomain to the Vercel project
export async function POST(req: NextRequest) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({ error: 'Vercel API not configured. Add VERCEL_TOKEN and VERCEL_PROJECT_ID to env vars.' }, { status: 500 })
  }

  const { subdomain } = await req.json()
  if (!subdomain) return NextResponse.json({ error: 'subdomain is required' }, { status: 400 })

  const domain = `${subdomain}.visquanta.com`

  try {
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${teamParam()}`,
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: domain }),
      }
    )

    const data = await res.json()

    if (res.ok) {
      return NextResponse.json({
        success: true,
        domain: data.name,
        verified: data.verified,
        verification: data.verification || null,
      })
    }

    // Domain already exists on project — that's fine
    if (res.status === 400 && data?.error?.code === 'domain_already_in_use') {
      return NextResponse.json({ success: true, domain, verified: true, already_exists: true })
    }

    // Domain conflict (used on another project)
    if (res.status === 409) {
      return NextResponse.json({ error: `Domain ${domain} is already used on another Vercel project`, code: 'conflict' }, { status: 409 })
    }

    return NextResponse.json({ error: data?.error?.message || 'Failed to add domain', details: data }, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET — Check domain status on Vercel
export async function GET(req: NextRequest) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({ error: 'Vercel API not configured' }, { status: 500 })
  }

  const subdomain = req.nextUrl.searchParams.get('subdomain')
  if (!subdomain) return NextResponse.json({ error: 'subdomain param required' }, { status: 400 })

  const domain = `${subdomain}.visquanta.com`

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam()}`,
      { headers: headers() }
    )

    if (res.status === 404) {
      return NextResponse.json({ registered: false, domain })
    }

    const data = await res.json()
    return NextResponse.json({
      registered: true,
      domain: data.name,
      verified: data.verified,
      verification: data.verification || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — Remove a subdomain from the Vercel project
export async function DELETE(req: NextRequest) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({ error: 'Vercel API not configured' }, { status: 500 })
  }

  const { subdomain } = await req.json()
  if (!subdomain) return NextResponse.json({ error: 'subdomain is required' }, { status: 400 })

  const domain = `${subdomain}.visquanta.com`

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam()}`,
      { method: 'DELETE', headers: headers() }
    )

    if (res.ok || res.status === 404) {
      return NextResponse.json({ success: true, domain })
    }

    const data = await res.json()
    return NextResponse.json({ error: data?.error?.message || 'Failed to remove domain' }, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
