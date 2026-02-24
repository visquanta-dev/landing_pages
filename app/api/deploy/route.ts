import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateStaticSite } from '@/lib/generate-static-html'

const VERCEL_TOKEN = process.env.VQ_VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

function vercelHeaders() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function teamParam() {
  return VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
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

    let domainStatus = { added: false, verified: false, error: '' }
    if (domainRes.ok) {
      const domainData = await domainRes.json()
      domainStatus = { added: true, verified: domainData.verified || false, error: '' }
    } else {
      const domainErr = await domainRes.json()
      // "already exists" is fine
      if (domainErr.error?.code === 'domain_already_in_use' || domainErr.error?.code === 'DOMAIN_ALREADY_IN_USE') {
        domainStatus = { added: true, verified: true, error: '' }
      } else {
        domainStatus = { added: false, verified: false, error: JSON.stringify(domainErr) }
      }
    }

    // 6. Update dealer record with deployment info
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
        ...domainStatus,
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
    if (domRes.ok) {
      domainInfo = await domRes.json()
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
