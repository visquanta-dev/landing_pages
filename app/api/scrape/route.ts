import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
const SCRAPE_BUDGET_MS = 55000
const PROCESSING_BUDGET_MS = 12000

export async function POST(req: NextRequest) {
  try {
    const requestStartedAt = Date.now()
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl

    const html = await withGlobalTimeout(fetchWithFallbacks(targetUrl), SCRAPE_BUDGET_MS)
    if (!html) return NextResponse.json({ error: 'Could not fetch the website. The site may be blocking automated requests.' }, { status: 400 })

    const baseUrl = new URL(targetUrl).origin
    const extractStartedAt = Date.now()
    const hasBudget = () => Date.now() - extractStartedAt < PROCESSING_BUDGET_MS

    const result = {
      source_url: targetUrl,
      dealership_name: timedExtract('dealership_name', () => extractDealerName(html)),
      brand: timedExtract('brand', () => extractBrand(html)),
      logo_url: timedExtract('logo_url', () => extractLogo(html, baseUrl)),
      phone_sales: timedExtract('phone_sales', () => extractPhones(html)),
      address: hasBudget()
        ? timedExtract('address', () => extractAddress(html))
        : { line1: '', city: '', state: '', zip: '', full: '' },
      hours: hasBudget()
        ? timedExtract('hours', () => extractHours(html))
        : {},
      hero_images: hasBudget()
        ? timedExtract('hero_images', () => extractHeroImages(html, baseUrl))
        : [],
      vehicle_images: hasBudget()
        ? timedExtract('vehicle_images', () => extractVehicleImages(html, baseUrl))
        : [],
      all_images: hasBudget()
        ? timedExtract('all_images', () => extractAllLargeImages(html, baseUrl))
        : [],
      meta_description: timedExtract('meta_description', () => extractMeta(html, 'description')),
      meta_title: timedExtract('meta_title', () => extractMeta(html, 'title')),
    }

    console.log('[scrape] Total request duration(ms):', Date.now() - requestStartedAt)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Scrape failed' }, { status: 500 })
  }
}

async function fetchWithFallbacks(url: string): Promise<string | null> {
  const startedAt = Date.now()

  console.log('[scrape] Strategy 1: Direct fetch for', url)
  const direct = await fetchDirect(url, startedAt)
  if (direct && direct.length > 500) {
    console.log('[scrape] Direct fetch succeeded:', direct.length, 'chars')
    return direct
  }

  console.log('[scrape] Strategy 2: Proxy fetch for', url)
  const proxied = await fetchViaProxy(url, startedAt)
  if (proxied && proxied.length > 500) {
    console.log('[scrape] Proxy fetch succeeded:', proxied.length, 'chars')
    return proxied
  }

  console.log('[scrape] Strategy 3: Alternative proxy for', url)
  const alt = await fetchViaAltProxy(url, startedAt)
  if (alt && alt.length > 500) {
    console.log('[scrape] Alt proxy succeeded:', alt.length, 'chars')
    return alt
  }

  console.log('[scrape] All strategies failed for', url)
  return null
}

async function withGlobalTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return await Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ])
}

function timedExtract<T>(name: string, fn: () => T): T {
  const startedAt = Date.now()
  const value = fn()
  console.log(`[scrape] ${name} extracted in(ms):`, Date.now() - startedAt)
  return value
}

function getRemainingMs(startedAt: number): number {
  return SCRAPE_BUDGET_MS - (Date.now() - startedAt)
}

function computeTimeoutMs(startedAt: number, preferredMs: number): number {
  const remaining = getRemainingMs(startedAt)
  if (remaining <= 1500) return 0
  return Math.min(preferredMs, remaining - 500)
}

async function fetchDirect(url: string, startedAt: number): Promise<string | null> {
  try {
    const timeoutMs = computeTimeoutMs(startedAt, 25000)
    if (timeoutMs <= 0) return null
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.text()
  } catch (e) {
    console.log('[scrape] Direct fetch error:', (e as Error).message)
    return null
  }
}

async function fetchViaProxy(url: string, startedAt: number): Promise<string | null> {
  try {
    const timeoutMs = computeTimeoutMs(startedAt, 20000)
    if (timeoutMs <= 0) return null
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl, {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.text()
  } catch (e) {
    console.log('[scrape] Proxy fetch error:', (e as Error).message)
    return null
  }
}

async function fetchViaAltProxy(url: string, startedAt: number): Promise<string | null> {
  try {
    const timeoutMs = computeTimeoutMs(startedAt, 20000)
    if (timeoutMs <= 0) return null
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.text()
  } catch (e) {
    console.log('[scrape] Alt proxy error:', (e as Error).message)
    return null
  }
}

function extractDealerName(html: string): string {
  const ogSite = matchOne(html, /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
  if (ogSite) return cleanText(ogSite)
  const title = matchOne(html, /<title[^>]*>([^<]+)<\/title>/i)
  if (title) {
    const name = title.split(/\s*[|\-\u2013:]\s*/)[0].trim()
    if (name.length > 2 && name.length < 80) return cleanText(name)
  }
  return ''
}

function extractBrand(html: string): string {
  const brands = ['Toyota', 'Ford', 'Chevrolet', 'Chevy', 'Honda', 'Hyundai', 'Kia', 'Nissan', 'Volkswagen', 'VW', 'Genesis', 'BMW', 'Mercedes-Benz', 'Mercedes', 'Audi', 'Lexus', 'Jeep', 'Ram', 'Dodge', 'Subaru', 'Mazda', 'Chrysler', 'Buick', 'GMC', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti', 'Volvo', 'Porsche', 'Land Rover', 'Jaguar', 'Mitsubishi', 'MINI', 'Fiat', 'Alfa Romeo']
  const title = matchOne(html, /<title[^>]*>([^<]+)<\/title>/i) || ''
  const ogTitle = matchOne(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || ''
  const combined = `${title} ${ogTitle}`.toLowerCase()
  for (const brand of brands) {
    if (combined.includes(brand.toLowerCase())) {
      if (brand === 'Chevy') return 'Chevrolet'
      if (brand === 'VW') return 'Volkswagen'
      if (brand === 'Mercedes') return 'Mercedes-Benz'
      return brand
    }
  }
  return 'Other'
}

function extractLogo(html: string, baseUrl: string): string {
  const patterns = [
    /<(?:img|source)[^>]*class=["'][^"']*logo[^"']*["'][^>]*(?:src|srcset)=["']([^"'\s]+)["']/gi,
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"'\s]+)["']/gi,
    /<img[^>]*src=["']([^"'\s]*logo[^"'\s]*)["']/gi,
    /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"'\s]+)["']/i,
    /<nav[^>]*>[\s\S]*?<img[^>]*src=["']([^"'\s]+)["']/i,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(html)
    if (match?.[1]) {
      const src = resolveUrl(match[1], baseUrl)
      if (src && !src.includes('pixel') && !src.includes('tracking') && !src.includes('1x1')) return src
    }
    pattern.lastIndex = 0
  }
  return ''
}

function extractPhones(html: string): string {
  const telLinks = html.match(/href=["']tel:([^"']+)["']/gi) || []
  const phones = new Set<string>()
  for (const link of telLinks) {
    const num = link.replace(/href=["']tel:/i, '').replace(/["']/g, '').replace(/[^\d+]/g, '')
    if (num.length >= 10) phones.add(formatPhone(num))
  }
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g
  let match
  while ((match = phoneRegex.exec(html)) !== null) {
    const num = match[1] + match[2] + match[3]
    if (num.length === 10) phones.add(formatPhone(num))
  }
  return Array.from(phones)[0] || ''
}

function extractAddress(html: string): { line1: string; city: string; state: string; zip: string; full: string } {
  const empty = { line1: '', city: '', state: '', zip: '', full: '' }
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of jsonLdMatches) {
    const json = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const data = JSON.parse(json)
      const address = data.address || data?.mainEntity?.address || data?.[0]?.address
      if (address) {
        return {
          line1: address.streetAddress || '', city: address.addressLocality || '',
          state: address.addressRegion || '', zip: address.postalCode || '',
          full: [address.streetAddress, address.addressLocality, address.addressRegion, address.postalCode].filter(Boolean).join(', ')
        }
      }
    } catch {}
  }
  const streetMatch = matchOne(html, /itemprop=["']streetAddress["'][^>]*>([^<]+)/i)
  const cityMatch = matchOne(html, /itemprop=["']addressLocality["'][^>]*>([^<]+)/i)
  const stateMatch = matchOne(html, /itemprop=["']addressRegion["'][^>]*>([^<]+)/i)
  const zipMatch = matchOne(html, /itemprop=["']postalCode["'][^>]*>([^<]+)/i)
  if (streetMatch || cityMatch) {
    const parts = { line1: cleanText(streetMatch || ''), city: cleanText(cityMatch || ''), state: cleanText(stateMatch || ''), zip: cleanText(zipMatch || '') }
    return { ...parts, full: [parts.line1, parts.city, parts.state, parts.zip].filter(Boolean).join(', ') }
  }
  const addrRegex = /(\d+\s+[A-Z][a-zA-Z\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Ln|Lane|Ct|Court|Pkwy|Parkway|Hwy|Highway)[.,]*)\s*(?:,?\s*)([A-Z][a-zA-Z\s]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/
  const addrMatch = html.match(addrRegex)
  if (addrMatch) {
    return { line1: addrMatch[1].trim().replace(/[.,]+$/, ''), city: addrMatch[2].trim(), state: addrMatch[3].trim(), zip: addrMatch[4].trim(), full: addrMatch[0].trim() }
  }
  return empty
}

function extractHours(html: string): Record<string, string> {
  const defaults: Record<string, string> = {
    monday: '9:00 AM – 8:00 PM', tuesday: '9:00 AM – 8:00 PM', wednesday: '9:00 AM – 8:00 PM',
    thursday: '9:00 AM – 8:00 PM', friday: '9:00 AM – 8:00 PM', saturday: '9:00 AM – 6:00 PM', sunday: 'Closed',
  }
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of jsonLdMatches) {
    const json = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const data = JSON.parse(json)
      const specs = data.openingHoursSpecification || data?.mainEntity?.openingHoursSpecification
      if (specs && Array.isArray(specs)) {
        const result: Record<string, string> = { ...defaults }
        const dayMap: Record<string, string> = {
          'Monday': 'monday', 'Tuesday': 'tuesday', 'Wednesday': 'wednesday',
          'Thursday': 'thursday', 'Friday': 'friday', 'Saturday': 'saturday', 'Sunday': 'sunday',
          'https://schema.org/Monday': 'monday', 'https://schema.org/Tuesday': 'tuesday',
          'https://schema.org/Wednesday': 'wednesday', 'https://schema.org/Thursday': 'thursday',
          'https://schema.org/Friday': 'friday', 'https://schema.org/Saturday': 'saturday',
          'https://schema.org/Sunday': 'sunday',
        }
        for (const spec of specs) {
          const days = Array.isArray(spec.dayOfWeek) ? spec.dayOfWeek : [spec.dayOfWeek]
          const opens = spec.opens || ''
          const closes = spec.closes || ''
          if (opens && closes) {
            const timeStr = `${formatTime(opens)} – ${formatTime(closes)}`
            for (const day of days) {
              const key = dayMap[day] || dayMap[day?.replace('https://schema.org/', '')]
              if (key) result[key] = timeStr
            }
          }
        }
        return result
      }
    } catch {}
  }
  return defaults
}

function extractHeroImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  const imgTags = html.match(/<img[^>]*>/gi) || []
  for (const tag of imgTags) {
    const haystack = tag.toLowerCase()
    if (!/(hero|banner|slide|main-image|feature)/.test(haystack)) continue
    const src = matchOne(tag, /src=["']([^"'\s]+)["']/i)
    const resolved = resolveUrl(src || '', baseUrl)
    if (resolved && isGoodImage(resolved) && !images.includes(resolved)) images.push(resolved)
  }
  const ogImage = matchOne(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  const ogResolved = resolveUrl(ogImage || '', baseUrl)
  if (ogResolved && isGoodImage(ogResolved) && !images.includes(ogResolved)) images.push(ogResolved)
  return images.slice(0, 5)
}

function extractVehicleImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  const imgTags = html.match(/<img[^>]*>/gi) || []
  for (const tag of imgTags) {
    const haystack = tag.toLowerCase()
    const srcRaw = matchOne(tag, /src=["']([^"'\s]+)["']/i) || ''
    if (!srcRaw) continue
    if (!/(vehicle|inventory|model|car|truck|suv|sedan|jelly|stock|vdp|srp)/.test(haystack + ' ' + srcRaw.toLowerCase())) continue
    const resolved = resolveUrl(srcRaw, baseUrl)
    if (resolved && isGoodImage(resolved) && !images.includes(resolved)) images.push(resolved)
  }
  return images.slice(0, 10)
}

function extractAllLargeImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  const imgRegex = /<img[^>]*src=["']([^"'\s]+)["'][^>]*/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const src = resolveUrl(match[1], baseUrl)
    if (!src || !isGoodImage(src)) continue
    const tag = match[0]
    const width = parseInt(matchOne(tag, /width=["']?(\d+)/i) || '0')
    const height = parseInt(matchOne(tag, /height=["']?(\d+)/i) || '0')
    if ((width >= 200 || height >= 150) || (width === 0 && height === 0)) {
      if (!images.includes(src)) images.push(src)
    }
  }
  return images.slice(0, 20)
}

function extractMeta(html: string, name: string): string {
  if (name === 'title') return cleanText(matchOne(html, /<title[^>]*>([^<]+)<\/title>/i) || '')
  return cleanText(
    matchOne(html, new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
    matchOne(html, new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i')) || ''
  )
}

function matchOne(html: string, regex: RegExp): string | null {
  const match = html.match(regex)
  return match?.[1] || null
}

function resolveUrl(src: string, baseUrl: string): string {
  if (!src || src.startsWith('data:') || src.length < 5) return ''
  if (src.startsWith('//')) return 'https:' + src
  if (src.startsWith('/')) return baseUrl + src
  if (src.startsWith('http')) return src
  return baseUrl + '/' + src
}

function isGoodImage(src: string): boolean {
  const lower = src.toLowerCase()
  if (lower.includes('pixel') || lower.includes('tracking') || lower.includes('1x1') || lower.includes('spacer')) return false
  if (lower.includes('.svg') && lower.includes('icon')) return false
  if (lower.includes('facebook') || lower.includes('twitter') || lower.includes('linkedin') || lower.includes('instagram')) return false
  if (lower.includes('google-analytics') || lower.includes('doubleclick')) return false
  if (lower.match(/\.(jpg|jpeg|png|webp|avif)/)) return true
  if (lower.includes('image') || lower.includes('photo') || lower.includes('media')) return true
  if (!lower.match(/\.(css|js|json|xml|pdf|doc|mp4|mp3|woff|ttf|eot)/)) return true
  return false
}

function formatPhone(num: string): string {
  const digits = num.replace(/\D/g, '')
  const d = digits.startsWith('1') ? digits.slice(1) : digits
  if (d.length !== 10) return num
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function formatTime(time: string): string {
  const parts = time.split(':')
  let hours = parseInt(parts[0])
  const mins = parts[1] || '00'
  const ampm = hours >= 12 ? 'PM' : 'AM'
  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12
  return `${hours}:${mins} ${ampm}`
}

function cleanText(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
}
