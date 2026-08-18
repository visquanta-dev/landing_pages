export function httpsUrl(value?: string | null) {
  const raw = (value || '').trim()
  if (!raw) return ''
  if (/^https:\/\//i.test(raw)) return raw
  if (/^http:\/\//i.test(raw)) return `https://${raw.slice(raw.indexOf('://') + 3)}`
  return `https://${raw.replace(/^\/+/, '')}`
}
