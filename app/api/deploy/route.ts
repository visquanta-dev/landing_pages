import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateStaticSite } from '@/lib/generate-static-html'

const VERCEL_TOKEN = process.env.VQ_VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '27fb2e9b237618a7855003324988899c'

function vercelHeaders() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function teamParam() {
  return VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
}

function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

function teamQuery(extra: Record<string, string | undefined> = {}) {
  return queryString({ ...extra, teamId: VERCEL_TEAM_ID })
}

function cloudflareHeaders() {
  return {
    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

async function readJson(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function getVercelProjectDomain(projectId: string, domain: string) {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}${teamQuery()}`,
    { headers: vercelHeaders() }
  )

  if (!res.ok) return null
  return readJson(res)
}

async function getVercelDomainConfig(projectId: string, domain: string) {
  const res = await fetch(
    `https://api.vercel.com/v6/domains/${domain}/config${teamQuery({ projectIdOrName: projectId })}`,
    { headers: vercelHeaders() }
  )

  if (!res.ok) return null
  return readJson(res)
}

async function verifyVercelProjectDomain(projectId: string, domain: string) {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}/verify${teamQuery()}`,
    { method: 'POST', headers: vercelHeaders() }
  )

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res),
  }
}

function normalizeDnsValue(value: string) {
  return value.replace(/\.$/, '')
}

async function listCloudflareRecords(type: string, name: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records${queryString({ type, name })}`,
    { headers: cloudflareHeaders() }
  )

  const data = await readJson(res)
  if (!res.ok || !data?.success) {
    throw new Error(`Cloudflare list ${type} ${name} failed: ${JSON.stringify(data)}`)
  }
  return data.result || []
}

async function upsertCloudflareRecord(record: {
  type: 'CNAME' | 'TXT'
  name: string
  content: string
  ttl?: number
  proxied?: boolean
  comment?: string
}) {
  const records = await listCloudflareRecords(record.type, record.name)
  const normalizedContent = normalizeDnsValue(record.content)
  const exact = records.find((r: any) => normalizeDnsValue(r.content) === normalizedContent)
  const existing = exact || (record.type === 'CNAME' ? records[0] : null)
  const payload = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl ?? 1,
    ...(record.type === 'CNAME' ? { proxied: record.proxied ?? false } : {}),
    ...(record.comment ? { comment: record.comment } : {}),
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records${existing ? `/${existing.id}` : ''}`,
    {
      method: existing ? 'PATCH' : 'POST',
      headers: cloudflareHeaders(),
      body: JSON.stringify(payload),
    }
  )

  const data = await readJson(res)
  if (!res.ok || !data?.success) {
    throw new Error(`Cloudflare ${existing ? 'update' : 'create'} ${record.type} ${record.name} failed: ${JSON.stringify(data)}`)
  }

  return {
    id: data.result?.id,
    type: record.type,
    name: record.name,
    content: record.content,
    action: existing ? 'updated' : 'created',
  }
}

async function configureCloudflareForVercelDomain(projectId: string, domain: string, domainData: any) {
  if (!CLOUDFLARE_API_TOKEN) {
    return {
      configured: false,
      skipped: true,
      error: 'CLOUDFLARE_API_TOKEN not configured',
      records: [],
    }
  }

  try {
    const config = await getVercelDomainConfig(projectId, domain)
    const recommendedCname = config?.recommendedCNAME
      ?.slice()
      ?.sort((a: any, b: any) => (a.rank || 999) - (b.rank || 999))
      ?.[0]?.value || 'cname.vercel-dns.com'

    const records = [
      await upsertCloudflareRecord({
        type: 'CNAME',
        name: domain,
        content: normalizeDnsValue(recommendedCname),
        proxied: false,
        comment: 'Managed by VisQuanta landing page deploy automation',
      }),
    ]

    for (const verification of domainData?.verification || []) {
      if (verification.type !== 'TXT' || !verification.domain || !verification.value) continue
      records.push(await upsertCloudflareRecord({
        type: 'TXT',
        name: verification.domain,
        content: verification.value,
        comment: `Managed by VisQuanta Vercel verification for ${domain}`,
      }))
    }

    const verification = await verifyVercelProjectDomain(projectId, domain)

    return {
      configured: true,
      skipped: false,
      config,
      records,
      verification,
    }
  } catch (e: any) {
    return {
      configured: false,
      skipped: false,
      error: e.message,
      records: [],
    }
  }
}

// POST — Deploy a dealer as a standalone Vercel project
export async function POST(req: NextRequest) {
  try {
    if (!VERCEL_TOKEN) {
      return NextResponse.json({ error: 'VERCEL_TOKEN not configured' }, { status: 500 })
    }

    const { subdomain } = await req.json()
    if (!subdomain) {
      return NextResponse.json({ error: 'subdomain required' }, { status: 400 })
    }

    // 1. Fetch dealer data from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: dealer, error: dbError } = await supabase
      .from('dealerships')
      .select('*')
      .eq('subdomain', subdomain)
      .single()

    if (dbError || !dealer) {
      return NextResponse.json({ error: `Dealer not found: ${subdomain}` }, { status: 404 })
    }

    // 2. Generate static site files
    const files = generateStaticSite(dealer)

    // 3. Create or find Vercel project
    const projectName = `vq-${subdomain}`
    let projectId: string

    // Try to get existing project first
    const getRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectName}${teamParam()}`,
      { headers: vercelHeaders() }
    )

    if (getRes.ok) {
      const existing = await getRes.json()
      projectId = existing.id
    } else {
      // Create new project
      const createRes = await fetch(
        `https://api.vercel.com/v11/projects${teamParam()}`,
        {
          method: 'POST',
          headers: vercelHeaders(),
          body: JSON.stringify({
            name: projectName,
            framework: null, // static site
          }),
        }
      )

      if (!createRes.ok) {
        const err = await createRes.json()
        return NextResponse.json({ error: 'Failed to create project', details: err }, { status: 500 })
      }

      const created = await createRes.json()
      projectId = created.id
    }

    // 4. Deploy files using Vercel API v13/deployments
    const deployRes = await fetch(
      `https://api.vercel.com/v13/deployments${teamParam()}`,
      {
        method: 'POST',
        headers: vercelHeaders(),
        body: JSON.stringify({
          name: projectName,
          project: projectId,
          target: 'production',
          files: files.map(f => ({
            file: f.file,
            data: Buffer.from(f.data).toString('base64'),
            encoding: 'base64',
          })),
          projectSettings: {
            framework: null,
          },
        }),
      }
    )

    if (!deployRes.ok) {
      const err = await deployRes.json()
      return NextResponse.json({ error: 'Failed to deploy', details: err }, { status: 500 })
    }

    const deployment = await deployRes.json()

    // 5. Add custom domain to the project
    const domain = `${subdomain}.visquanta.com`
    const domainRes = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains${teamParam()}`,
      {
        method: 'POST',
        headers: vercelHeaders(),
        body: JSON.stringify({ name: domain }),
      }
    )

    let domainData: any = null
    let domainStatus = { added: false, verified: false, error: '' }
    if (domainRes.ok) {
      domainData = await domainRes.json()
      domainStatus = { added: true, verified: domainData.verified || false, error: '' }
    } else {
      const domainErr = await domainRes.json()
      // "already exists" is fine
      if (domainErr.error?.code === 'domain_already_in_use' || domainErr.error?.code === 'DOMAIN_ALREADY_IN_USE') {
        domainData = await getVercelProjectDomain(projectId, domain)
        domainStatus = { added: true, verified: domainData?.verified || false, error: '' }
      } else {
        domainStatus = { added: false, verified: false, error: JSON.stringify(domainErr) }
      }
    }

    // 6. Configure Cloudflare DNS and ask Vercel to verify the domain.
    let dnsStatus = null
    if (domainStatus.added && domainData) {
      dnsStatus = await configureCloudflareForVercelDomain(projectId, domain, domainData)
      const latestDomainData = await getVercelProjectDomain(projectId, domain)
      if (latestDomainData) {
        domainData = latestDomainData
        domainStatus = { added: true, verified: latestDomainData.verified || false, error: '' }
      }
    }

    // 7. Update dealer record with deployment info
    await supabase
      .from('dealerships')
      .update({
        vercel_project_id: projectId,
        vercel_deployment_url: deployment.url,
        deployed_at: new Date().toISOString(),
      })
      .eq('subdomain', subdomain)

    return NextResponse.json({
      success: true,
      project: {
        id: projectId,
        name: projectName,
      },
      deployment: {
        id: deployment.id,
        url: deployment.url,
        readyState: deployment.readyState,
      },
      domain: {
        name: domain,
        verification: domainData?.verification || null,
        ...domainStatus,
        dns: dnsStatus,
      },
      liveUrl: `https://${domain}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET — Check deployment status for a dealer
export async function GET(req: NextRequest) {
  try {
    if (!VERCEL_TOKEN) {
      return NextResponse.json({ error: 'VERCEL_TOKEN not configured' }, { status: 500 })
    }

    const subdomain = req.nextUrl.searchParams.get('subdomain')
    if (!subdomain) {
      return NextResponse.json({ error: 'subdomain param required' }, { status: 400 })
    }

    const projectName = `vq-${subdomain}`
    const domain = `${subdomain}.visquanta.com`

    // Check project exists
    const projRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectName}${teamParam()}`,
      { headers: vercelHeaders() }
    )

    if (!projRes.ok) {
      return NextResponse.json({ deployed: false, project: null, domain: null })
    }

    const project = await projRes.json()

    // Check domain status
    const domRes = await fetch(
      `https://api.vercel.com/v9/projects/${project.id}/domains/${domain}${teamParam()}`,
      { headers: vercelHeaders() }
    )

    let domainInfo = null
    let dnsStatus = null
    if (domRes.ok) {
      domainInfo = await domRes.json()
      if (!domainInfo.verified) {
        dnsStatus = await configureCloudflareForVercelDomain(project.id, domain, domainInfo)
        const refreshed = await getVercelProjectDomain(project.id, domain)
        if (refreshed) domainInfo = refreshed
      }
    }

    // Get latest deployment
    const deplRes = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${project.id}&target=production&limit=1${VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : ''}`,
      { headers: vercelHeaders() }
    )

    let latestDeployment = null
    if (deplRes.ok) {
      const deplData = await deplRes.json()
      latestDeployment = deplData.deployments?.[0] || null
    }

    return NextResponse.json({
      deployed: true,
      project: {
        id: project.id,
        name: project.name,
      },
      domain: domainInfo ? {
        name: domain,
        verified: domainInfo.verified,
        verification: domainInfo.verification,
        dns: dnsStatus,
      } : null,
      latestDeployment: latestDeployment ? {
        id: latestDeployment.uid,
        url: latestDeployment.url,
        state: latestDeployment.state,
        created: latestDeployment.created,
      } : null,
      liveUrl: `https://${domain}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — Remove a dealer's Vercel project
export async function DELETE(req: NextRequest) {
  try {
    if (!VERCEL_TOKEN) {
      return NextResponse.json({ error: 'VERCEL_TOKEN not configured' }, { status: 500 })
    }

    const { subdomain } = await req.json()
    if (!subdomain) {
      return NextResponse.json({ error: 'subdomain required' }, { status: 400 })
    }

    const projectName = `vq-${subdomain}`

    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectName}${teamParam()}`,
      { method: 'DELETE', headers: vercelHeaders() }
    )

    if (!res.ok && res.status !== 404) {
      const err = await res.json()
      return NextResponse.json({ error: 'Failed to delete project', details: err }, { status: 500 })
    }

    // Clear deployment info from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase
      .from('dealerships')
      .update({
        vercel_project_id: null,
        vercel_deployment_url: null,
        deployed_at: null,
      })
      .eq('subdomain', subdomain)

    return NextResponse.json({ success: true, deleted: projectName })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
