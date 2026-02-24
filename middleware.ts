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
