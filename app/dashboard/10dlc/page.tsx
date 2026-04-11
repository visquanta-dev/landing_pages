'use client'

import { useState, useEffect, useMemo } from 'react'

type Brand = {
  brandId: string
  displayName: string
  companyName: string
  identityStatus: string
  assignedCampaignsCount: number
  website: string
  email: string
  // Merged from Supabase
  phone: string | null
  contactEmail: string | null
  subdomain: string | null
  domain: string | null
  city: string | null
  state: string | null
  dbaName: string
}

type BulkResult = {
  brandId: string
  displayName: string
  success: boolean
  data?: any
  error?: any
}

// Default campaign template
function buildCampaign(brand: Brand) {
  const legalName = brand.companyName
  const dba = brand.dbaName || brand.displayName
  const domain = brand.domain || 'visquanta.com'
  const phone = brand.phone || '(000) 000-0000'
  const contactEmail = brand.contactEmail || `contact@${domain}`

  return {
    brandId: brand.brandId,
    _displayName: dba,
    usecase: 'CUSTOMER_CARE',
    description: `This campaign is used by ${legalName} (DBA: ${dba}) to send recurring automated SMS appointment confirmations, service reminders, rescheduling notifications, and other account-related updates to customers who book through the business website contact form or in-office intake. Customers provide explicit consent by entering their mobile number and selecting an unchecked SMS consent checkbox prior to form submission. The disclosure clearly states that message frequency may vary, Msg and data rates may apply, and includes opt-out instructions. Consent is not a condition of purchase. After submitting the form and providing consent, customers receive a confirmation message acknowledging their subscription. No promotional or marketing messages are sent as part of this campaign.`,
    messageFlow: `Customers visit ${domain} or complete an in-office intake form to book an appointment or consultation. During the booking process, customers provide their mobile number and must select an unchecked SMS consent checkbox before submitting the form. The disclosure states: "By providing your phone number, you consent to receive recurring automated SMS appointment confirmations, reminders, rescheduling options, and service updates from ${legalName}. Message frequency may vary. Msg and data rates may apply. Reply STOP to opt out. Reply HELP for help. Consent is not a condition of purchase. We will not share your information with third parties for marketing purposes." After form submission and consent, the customer receives the following opt-in confirmation SMS: "${legalName}: You are subscribed to receive recurring automated appointment confirmations and service updates. Message frequency may vary. Msg and data rates may apply. Reply STOP to cancel or HELP for help."`,
    helpMessage: `${dba}: For assistance, please contact us at ${phone} or ${contactEmail}. Reply STOP to unsubscribe.`,
    optinKeywords: 'START',
    optoutKeywords: 'STOP',
    helpKeywords: 'HELP',
    sample1: `${dba}: Your service appointment is confirmed for 3/22 at 10:30 AM. Call ${phone} to reschedule. Reply STOP to opt out or HELP for help.`,
    sample2: `${dba}: Hi John, this is Emily confirming your appointment on July 20 at 11:00 AM. Call ${phone} if you need to reschedule. Reply STOP to opt out or HELP for help.`,
    sample3: `${dba}: Hi John, this is Emily. We're looking forward to seeing you today at 11:00 AM for your appointment. Call ${phone} if you need assistance. Reply STOP to opt out or HELP for help.`,
    sample4: `${dba}: Hi Brian, we noticed you missed your scheduled appointment. Would you like to reschedule? Call ${phone} or visit ${domain} to book a new time. Reply STOP to opt out or HELP for help.`,
    embeddedLink: true,
    embeddedPhone: true,
  }
}

// Brands to exclude from campaign creation
const EXCLUDED_BRAND_IDS = new Set([
  '4b20019a-c89e-540d-73f0-c9db15749e23', // VisQuanta
  '4b200199-a014-2871-4698-2e310d281115', // Honda of El Cajon
  '4b200199-1bf5-1222-032e-58e5f3ab3d6e', // Wetmore's CDJR
])

export default function TenDLCPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'no_campaign' | 'has_campaign'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [previewBrand, setPreviewBrand] = useState<Brand | null>(null)
  const [notifications, setNotifications] = useState<Array<{ id: number; type: 'success' | 'error'; message: string }>>([])

  useEffect(() => { fetchBrands() }, [])

  async function fetchBrands() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/10dlc?action=brands')
      const data = await res.json()
      if (Array.isArray(data)) {
        setBrands(data)
      } else {
        setError(data.error || 'Failed to fetch brands')
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  function pushNotification(type: 'success' | 'error', message: string) {
    const id = Date.now() + Math.floor(Math.random() * 10000)
    setNotifications(prev => [...prev, { id, type, message }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4500)
  }

  const filtered = useMemo(() => {
    let list = brands
    if (filter === 'no_campaign') list = list.filter(b => b.assignedCampaignsCount === 0)
    if (filter === 'has_campaign') list = list.filter(b => b.assignedCampaignsCount > 0)
    return list
  }, [brands, filter])

  const noCampaignBrands = useMemo(
    () => brands.filter(b => b.assignedCampaignsCount === 0 && !EXCLUDED_BRAND_IDS.has(b.brandId)),
    [brands]
  )

  function toggleSelect(brandId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(brandId)) next.delete(brandId)
      else next.add(brandId)
      return next
    })
  }

  function selectAllNoCampaign() {
    setSelected(new Set(noCampaignBrands.map(b => b.brandId)))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  async function handleCreateBulk() {
    if (selected.size === 0) return
    if (!confirm(`Create 10DLC campaigns for ${selected.size} brand(s)? This will submit to TCR for carrier approval.`)) return

    setCreating(true)
    setBulkResults([])

    const selectedBrands = brands.filter(b => selected.has(b.brandId))
    const campaigns = selectedBrands.map(b => buildCampaign(b))

    try {
      const res = await fetch('/api/10dlc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_campaigns_bulk', campaigns }),
      })
      const data = await res.json()

      if (data.results) {
        setBulkResults(data.results)
        const successes = data.results.filter((r: BulkResult) => r.success).length
        const failures = data.results.filter((r: BulkResult) => !r.success).length
        if (successes > 0) pushNotification('success', `${successes} campaign(s) created successfully`)
        if (failures > 0) pushNotification('error', `${failures} campaign(s) failed`)
        fetchBrands()
        setSelected(new Set())
      }
    } catch (e: any) {
      pushNotification('error', e.message)
    }

    setCreating(false)
  }

  const stats = useMemo(() => ({
    total: brands.length,
    withCampaign: brands.filter(b => b.assignedCampaignsCount > 0).length,
    noCampaign: brands.filter(b => b.assignedCampaignsCount === 0).length,
    eligible: noCampaignBrands.length,
  }), [brands, noCampaignBrands])

  return (
    <>
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-[70] space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur ${
              n.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>{n.message}</div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">10DLC Campaigns</h1>
          <p className="text-sm text-white/40 mt-1">
            {stats.withCampaign} of {stats.total} brands have campaigns registered
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="text-sm font-medium text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-2.5 rounded-lg transition-all appearance-none cursor-pointer outline-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
          >
            <option value="all" style={{ background: '#111' }}>All Brands ({stats.total})</option>
            <option value="no_campaign" style={{ background: '#111' }}>No Campaign ({stats.noCampaign})</option>
            <option value="has_campaign" style={{ background: '#111' }}>Has Campaign ({stats.withCampaign})</option>
          </select>
          <button
            onClick={fetchBrands}
            disabled={loading}
            className="text-sm font-medium text-white/50 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-4 py-2.5 rounded-lg transition-all"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Brands', value: stats.total, color: 'text-white' },
          { label: 'With Campaign', value: stats.withCampaign, color: 'text-emerald-400' },
          { label: 'No Campaign', value: stats.noCampaign, color: 'text-amber-400' },
          { label: 'Eligible', value: stats.eligible, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#141414] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk action bar */}
      {noCampaignBrands.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-white/60">
              <span className="text-white font-semibold">{selected.size}</span> of {noCampaignBrands.length} eligible brands selected
            </p>
            <button onClick={selectAllNoCampaign} className="text-xs text-red-400 hover:text-red-300 transition-colors">Select All Eligible</button>
            {selected.size > 0 && <button onClick={deselectAll} className="text-xs text-white/40 hover:text-white/60 transition-colors">Deselect All</button>}
          </div>
          <button
            onClick={handleCreateBulk}
            disabled={selected.size === 0 || creating}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
          >
            {creating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" className="opacity-30"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                Creating...
              </>
            ) : (
              `Create ${selected.size} Campaign${selected.size !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}

      {/* Bulk results */}
      {bulkResults.length > 0 && (
        <div className="mb-6 bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
          <p className="text-sm font-semibold text-white mb-2">Bulk Results</p>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            {bulkResults.map(r => (
              <div key={r.brandId} className="text-xs">
                <span className={r.success ? 'text-emerald-400' : 'text-red-400'}>{r.success ? 'OK' : 'FAIL'}</span>
                <span className="text-white/70"> — {r.displayName}</span>
                {!r.success && r.error && (
                  <span className="text-white/40"> ({typeof r.error === 'string' ? r.error : JSON.stringify(r.error)})</span>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setBulkResults([])} className="text-xs text-white/30 hover:text-white/50 mt-2 transition-colors">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">{error}</div>
      )}

      {/* Brand list */}
      {loading ? (
        <div className="text-center py-20 text-white/30">Loading brands from Telnyx...</div>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_1fr_140px_120px_100px_80px] gap-3 px-4 py-2 text-[11px] font-semibold text-white/30 uppercase tracking-widest">
            <span></span>
            <span>Display Name</span>
            <span>Legal Entity</span>
            <span>Domain</span>
            <span>Phone</span>
            <span>Status</span>
            <span>Campaign</span>
          </div>

          {filtered.map(brand => {
            const hasCampaign = brand.assignedCampaignsCount > 0
            const isExcluded = EXCLUDED_BRAND_IDS.has(brand.brandId)
            const canSelect = !hasCampaign && !isExcluded

            return (
              <div key={brand.brandId} className={`grid grid-cols-[40px_1fr_1fr_140px_120px_100px_80px] gap-3 items-center px-4 py-3 rounded-xl border transition-all ${
                selected.has(brand.brandId)
                  ? 'bg-red-500/[0.06] border-red-500/20'
                  : 'bg-[#141414] border-white/[0.06] hover:border-white/[0.12]'
              }`}>
                {/* Checkbox */}
                <div>
                  {canSelect && (
                    <button
                      onClick={() => toggleSelect(brand.brandId)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        selected.has(brand.brandId)
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {selected.has(brand.brandId) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Display name */}
                <div>
                  <p className="text-sm font-medium truncate">{brand.displayName}</p>
                  {brand.city && <p className="text-[11px] text-white/30">{brand.city}, {brand.state}</p>}
                </div>

                {/* Legal entity */}
                <p className="text-xs text-white/50 truncate">{brand.companyName}</p>

                {/* Domain */}
                <p className="text-xs text-white/40 truncate">{brand.domain || '—'}</p>

                {/* Phone */}
                <p className="text-xs text-white/40 truncate">{brand.phone || '—'}</p>

                {/* Identity status */}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full w-fit ${
                  brand.identityStatus === 'VETTED_VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  brand.identityStatus === 'VERIFIED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {brand.identityStatus === 'VETTED_VERIFIED' ? 'Vetted' : brand.identityStatus}
                </span>

                {/* Campaign status */}
                <div className="flex items-center gap-2">
                  {hasCampaign ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {brand.assignedCampaignsCount}
                    </span>
                  ) : isExcluded ? (
                    <span className="text-[10px] text-white/20">Skip</span>
                  ) : (
                    <button
                      onClick={() => setPreviewBrand(brand)}
                      className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Campaign preview modal */}
      {previewBrand && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
              <div>
                <h2 className="font-semibold text-lg">Campaign Preview</h2>
                <p className="text-xs text-white/40 mt-0.5">{previewBrand.displayName}</p>
              </div>
              <button onClick={() => setPreviewBrand(null)} className="text-white/30 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-all">✕</button>
            </div>
            <div className="px-6 py-6 space-y-4">
              {(() => {
                const campaign = buildCampaign(previewBrand)
                const fields = [
                  { label: 'Use Case', value: campaign.usecase },
                  { label: 'Description', value: campaign.description },
                  { label: 'Message Flow', value: campaign.messageFlow },
                  { label: 'Help Message', value: campaign.helpMessage },
                  { label: 'Sample 1', value: campaign.sample1 },
                  { label: 'Sample 2', value: campaign.sample2 },
                  { label: 'Sample 3', value: campaign.sample3 },
                  { label: 'Sample 4', value: campaign.sample4 },
                  { label: 'Opt-in Keywords', value: campaign.optinKeywords },
                  { label: 'Opt-out Keywords', value: campaign.optoutKeywords },
                  { label: 'Help Keywords', value: campaign.helpKeywords },
                ]
                return fields.map(f => (
                  <div key={f.label}>
                    <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">{f.label}</label>
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{f.value}</div>
                  </div>
                ))
              })()}

              {!previewBrand.phone && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-400">
                  Warning: No phone number found for this brand. The campaign will use a placeholder.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] sticky bottom-0 bg-[#111]">
              <button onClick={() => setPreviewBrand(null)} className="text-sm text-white/40 hover:text-white/60 transition-colors">Close</button>
              <button
                onClick={() => {
                  toggleSelect(previewBrand.brandId)
                  setPreviewBrand(null)
                }}
                className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg transition-all hover:-translate-y-0.5"
              >
                {selected.has(previewBrand.brandId) ? 'Deselect' : 'Select for Creation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
