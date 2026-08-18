export function usableImageUrl(value?: string | null) {
  const raw = (value || '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (['undefined', 'null', 'none', 'n/a', '#', 'about:blank'].includes(lower)) return ''
  if (lower.startsWith('javascript:') || lower.startsWith('data:text')) return ''
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/') || raw.startsWith('data:') || /^https?:\/\//i.test(raw)) return raw
  return ''
}

export const HIDE_BROKEN_IMAGE = 'this.remove()'
export const HIDE_BROKEN_HERO_CARD = "var card=this.closest('[data-hero-card]');if(card)card.remove();else this.remove();"
