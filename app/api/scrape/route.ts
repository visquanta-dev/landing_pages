import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // Normalize URL
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl

    // Fetch the homepage
    const html = await fetchPage(targetUrl)
    if (!html) return NextResponse.json({ error: 'Could not fetch the website' }, { status: 400 })

    const baseUrl = new URL(targetUrl).origin

    // Extract everything
    const result = {
      source_url: targetUrl,
      dealership_name: extractDealerName(html),
      brand: extractBrand(html),
      logo_url: extractLogo(html, baseUrl),
      phone_sales: extractPhones(html),
      address: extractAddress(html),
      hours: extractHours(html),
      hero_images: extractHeroImages(html, baseUrl),
      vehicle_images: extractVehicleImages(html, baseUrl),
      all_images: extractAllLargeImages(html, baseUrl),
      meta_description: extractMeta(html, 'description'),
      meta_title: extractMeta(html, 'title'),
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Scrape failed' }, { status: 500 })
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function extractDealerName(html: string): string {
  // Try og:site_name first
  const ogSite = matchOne(html, /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
  if (ogSite) return cleanText(ogSite)

  // Try <title> tag - often "Dealer Name | City, ST"
  const title = matchOne(html, /<title[^>]*>([^<]+)<\/title>/i)
  if (title) {
    // Take the first part before | or - or :
    const name = title.split(/\s*[|\-–:]\s*/)[0].trim()
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
  // Common patterns for dealer logos
  const patterns = [
    // Logo in header with class
    /<(?:img|source)[^>]*class=["'][^"']*logo[^"']*["'][^>]*(?:src|srcset)=["']([^"'\s]+)["']/gi,
    // Image with logo in alt
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"'\s]+)["']/gi,
    // Image with logo in src/filename
    /<img[^>]*src=["']([^"'\s]*logo[^"'\s]*)["']/gi,
    // Header img (first image in header)
    /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"'\s]+)["']/i,
    // Nav img
    /<nav[^>]*>[\s\S]*?<img[^>]*src=["']([^"'\s]+)["']/i,
    // og:image as fallback
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(html)
    if (match?.[1]) {
      const src = resolveUrl(match[1], baseUrl)
      if (src && !src.includes('pixel') && !src.includes('tracking') && !src.includes('1x1')) {
        return src
      }
    }
    pattern.lastIndex = 0 // Reset regex
  }
  return ''
}

function extractPhones(html: string): string {
  // Find tel: links first (most reliable)
  const telLinks = html.match(/href=["']tel:([^"']+)["']/gi) || []
  const phones = new Set<string>()
  
  for (const link of telLinks) {
    const num = link.replace(/href=["']tel:/i, '').replace(/["']/g, '').replace(/[^\d+]/g, '')
    if (num.length >= 10) {
      phones.add(formatPhone(num))
    }
  }

  // Also try to find phone patterns in text
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g
  let match
  while ((match = phoneRegex.exec(html)) !== null) {
    const num = match[1] + match[2] + match[3]
    if (num.length === 10) phones.add(formatPhone(num))
  }

  return Array.from(phones)[0] || ''
}

function extractAddress(html: string): {
  line1: string; city: string; state: string; zip: string; full: string
} {
  const empty = { line1: '', city: '', state: '', zip: '', full: '' }

  // Try structured data (JSON-LD)
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of jsonLdMatches) {
    const json = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const data = JSON.parse(json)
      const address = data.address || data?.mainEntity?.address || data?.[0]?.address
      if (address) {
        return {
          line1: address.streetAddress || '',
          city: address.addressLocality || '',
          state: address.addressRegion || '',
          zip: address.postalCode || '',
          full: [address.streetAddress, address.addressLocality, address.addressRegion, address.postalCode].filter(Boolean).join(', ')
        }
      }
    } catch {}
  }

  // Try address microdata
  const streetMatch = matchOne(html, /itemprop=["']streetAddress["'][^>]*>([^<]+)/i)
  const cityMatch = matchOne(html, /itemprop=["']addressLocality["'][^>]*>([^<]+)/i)
  const stateMatch = matchOne(html, /itemprop=["']addressRegion["'][^>]*>([^<]+)/i)
  const zipMatch = matchOne(html, /itemprop=["']postalCode["'][^>]*>([^<]+)/i)

  if (streetMatch || cityMatch) {
    const parts = { line1: cleanText(streetMatch || ''), city: cleanText(cityMatch || ''), state: cleanText(stateMatch || ''), zip: cleanText(zipMatch || '') }
    return { ...parts, full: [parts.line1, parts.city, parts.state, parts.zip].filter(Boolean).join(', ') }
  }

  // Try common address pattern in text
  const addrRegex = /(\d+\s+[A-Z][a-zA-Z\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Ln|Lane|Ct|Court|Pkwy|Parkway|Hwy|Highway)[.,]*)\s*(?:,?\s*)([A-Z][a-zA-Z\s]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/
  const addrMatch = html.match(addrRegex)
  if (addrMatch) {
    return {
      line1: addrMatch[1].trim().replace(/[.,]+$/, ''),
      city: addrMatch[2].trim(),
      state: addrMatch[3].trim(),
      zip: addrMatch[4].trim(),
      full: addrMatch[0].trim()
    }
  }

  return empty
}

function extractHours(html: string): Record<string, string> {
  const defaults: Record<string, string> = {
    monday: '9:00 AM – 8:00 PM',
    tuesday: '9:00 AM – 8:00 PM',
    wednesday: '9:00 AM – 8:00 PM',
    thursday: '9:00 AM – 8:00 PM',
    friday: '9:00 AM – 8:00 PM',
    saturday: '9:00 AM – 6:00 PM',
    sunday: 'Closed',
  }

  // Try JSON-LD
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

  // Look for large hero/banner images
  const patterns = [
    /<(?:img|source)[^>]*class=["'][^"']*(?:hero|banner|slide|main-image|feature)[^"']*["'][^>]*(?:src|srcset)=["']([^"'\s]+)["']/gi,
    /<(?:section|div)[^>]*class=["'][^"']*(?:hero|banner|slider)[^"']*["'][\s\S]*?<img[^>]*src=["']([^"'\s]+)["']/gi,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const src = resolveUrl(match[1], baseUrl)
      if (src && isGoodImage(src) && !images.includes(src)) {
        images.push(src)
      }
    }
    pattern.lastIndex = 0
  }

  return images.slice(0, 5)
}

function extractVehicleImages(html: string, baseUrl: string): string[] {
  const images: string[] = []

  // Look for vehicle/inventory images
  const patterns = [
    /<img[^>]*(?:class|alt)=["'][^"']*(?:vehicle|inventory|model|car|truck|suv|sedan)[^"']*["'][^>]*src=["']([^"'\s]+)["']/gi,
    /<img[^>]*src=["']([^"'\s]+)["'][^>]*(?:class|alt)=["'][^"']*(?:vehicle|inventory|model|car|truck|suv|sedan)[^"']*["']/gi,
    // Jelly render / stock photo patterns
    /<img[^>]*src=["']([^"'\s]*(?:jelly|stock|vehicle|vdp|srp)[^"'\s]*)["']/gi,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const src = resolveUrl(match[1], baseUrl)
      if (src && isGoodImage(src) && !images.includes(src)) {
        images.push(src)
      }
    }
    pattern.lastIndex = 0
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
    
    // Check for width/height attributes suggesting large images
    const tag = match[0]
    const width = parseInt(matchOne(tag, /width=["']?(\d+)/i) || '0')
    const height = parseInt(matchOne(tag, /height=["']?(\d+)/i) || '0')

    // Include if it has decent dimensions or no dimensions specified (likely CSS-sized)
    if ((width >= 200 || height >= 150) || (width === 0 && height === 0)) {
      if (!images.includes(src)) images.push(src)
    }
  }

  return images.slice(0, 20)
}

function extractMeta(html: string, name: string): string {
  if (name === 'title') {
    return cleanText(matchOne(html, /<title[^>]*>([^<]+)<\/title>/i) || '')
  }
  return cleanText(
    matchOne(html, new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
    matchOne(html, new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i')) ||
    ''
  )
}

// --- Helpers ---

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
  // Skip tiny/tracking images
  if (lower.includes('pixel') || lower.includes('tracking') || lower.includes('1x1') || lower.includes('spacer')) return false
  if (lower.includes('.svg') && lower.includes('icon')) return false
  if (lower.includes('facebook') || lower.includes('twitter') || lower.includes('linkedin') || lower.includes('instagram')) return false
  if (lower.includes('google-analytics') || lower.includes('doubleclick')) return false
  // Must be an image
  if (lower.match(/\.(jpg|jpeg|png|webp|avif)/)) return true
  if (lower.includes('image') || lower.includes('photo') || lower.includes('media')) return true
  // Allow if no clear extension (could be CDN URL)
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
  // Convert "09:00" or "09:00:00" to "9:00 AM"
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
