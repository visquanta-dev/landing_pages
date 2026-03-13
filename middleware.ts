import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const hostname = req.headers.get('host') || ''
  
  // Extract subdomain from hostname
  // Handles: cloningertoyota.visquanta.com, cloningertoyota.localhost:3000
  const baseDomains = [
    'visquanta.com',
    'localhost:3000',
    'localhost:3001',
    process.env.VERCEL_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
  ].filter(Boolean) as string[]

  let subdomain: string | null = null
  
  for (const base of baseDomains) {
    if (hostname.endsWith(base) && hostname !== base && hostname !== `www.${base}`) {
      subdomain = hostname.replace(`.${base}`, '')
      break
    }
  }

  if (subdomain === 'db') {
    const isDashboardPage = url.pathname === '/' || url.pathname === '' || url.pathname.startsWith('/dashboard')
    const isAuthApi = url.pathname.startsWith('/api/auth')
    const isLoginPage = url.pathname === '/login'

    if (isDashboardPage && !isAuthApi && !isLoginPage) {
      const authCookie = req.cookies.get('vq_auth')?.value
      const defaultPassword = 'VQ2026_@Abcd'
      const configuredPassword = (process.env.DASHBOARD_PASSWORD || '').trim()
      const validPasswords = new Set([defaultPassword, configuredPassword].filter(Boolean))

      if (!authCookie || !validPasswords.has(authCookie)) {
        url.pathname = '/login'
        return NextResponse.rewrite(url)
      }
    }

    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // If we found a subdomain and we're on the root path, rewrite to the preview page
  if (subdomain && (url.pathname === '/' || url.pathname === '')) {
    url.pathname = `/preview/${subdomain}`
    return NextResponse.rewrite(url)
  }

  // If subdomain and on a sub-path, also rewrite
  if (subdomain && !url.pathname.startsWith('/dashboard') && !url.pathname.startsWith('/preview') && !url.pathname.startsWith('/api')) {
    url.pathname = `/preview/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}
