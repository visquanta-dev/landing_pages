'use client'

import { useState, useEffect } from 'react'
import type { Dealership } from '@/lib/supabase'
import DealerForm from '@/components/DealerForm'

export default function DashboardPage() {
  const [dealerships, setDealerships] = useState<Dealership[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Dealership | null>(null)
  const [showScraper, setShowScraper] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeData, setScrapeData] = useState<any>(null)
  const [scrapeError, setScrapeError] = useState('')
  const [bulkDeploying, setBulkDeploying] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; subdomain: string } | null>(null)
  const [bulkResults, setBulkResults] = useState<Array<{ subdomain: string; success: boolean; error?: string; liveUrl?: string }>>([])
  const [notifications, setNotifications] = useState<Array<{ id: number; type: 'success' | 'error'; message: string }>>([])
  const [typeFilter, setTypeFilter] = useState<'all' | 'dealership' | 'gym' | 'insurance'>('all')

  const filtered = typeFilter === 'all' ? dealerships : dealerships.filter(d => (d.business_type || 'dealership') === typeFilter)

  useEffect(() => { fetchDealerships() }, [])

  async function fetchDealerships() {
    setLoading(true)
    const res = await fetch('/api/dealerships')
    const data = await res.json()
    setDealerships(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    await fetch('/api/dealerships', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchDealerships()
  }

  function handleEdit(d: Dealership) {
    setEditing(d)
    setScrapeData(null)
    setShowForm(true)
  }

  function handleFormClose() {
    setShowForm(false)
    setEditing(null)
    setScrapeData(null)
    fetchDealerships()
  }

  async function handleScrape() {
    if (!scrapeUrl.trim()) return
    setScraping(true)
    setScrapeError('')
    setScrapeData(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Server returned an invalid response. The site may be too slow or blocking requests.')
      }
      if (data.error) {
        setScrapeError(data.error)
      } else {
        setScrapeData(data)
        setShowScraper(false)
        setEditing(null)
        setShowForm(true)
      }
    } catch (e: any) {
      setScrapeError(e.message || 'Scrape failed')
    }
    setScraping(false)
  }

  function handleNewManual() {
    setEditing(null)
    setScrapeData(null)
    setShowScraper(false)
    setShowForm(true)
  }

  function pushNotification(type: 'success' | 'error', message: string) {
    const id = Date.now() + Math.floor(Math.random() * 10000)
    setNotifications(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4500)
  }

  async function handleRedeployAll() {
    if (!dealerships.length || bulkDeploying) return
    if (!confirm(`Redeploy ${dealerships.length} dealership sites sequentially?`)) return

    setBulkDeploying(true)
    setBulkResults([])
    const results: Array<{ subdomain: string; success: boolean; error?: string; liveUrl?: string }> = []

    for (let i = 0; i < dealerships.length; i++) {
      const d = dealerships[i]
      setBulkProgress({ current: i + 1, total: dealerships.length, subdomain: d.subdomain })

      try {
        const res = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subdomain: d.subdomain }),
        })

        const text = await res.text()
        let data: any = {}
        try {
          data = JSON.parse(text)
        } catch {
          data = { error: 'Invalid response from deploy API' }
        }

        if (res.ok && data.success) {
          results.push({ subdomain: d.subdomain, success: true, liveUrl: data.liveUrl })
          pushNotification('success', `${d.subdomain} deployed successfully`)
        } else {
          results.push({ subdomain: d.subdomain, success: false, error: data.error || `HTTP ${res.status}` })
          pushNotification('error', `${d.subdomain} failed: ${data.error || `HTTP ${res.status}`}`)
        }
      } catch (e: any) {
        results.push({ subdomain: d.subdomain, success: false, error: e.message || 'Deploy failed' })
        pushNotification('error', `${d.subdomain} failed: ${e.message || 'Deploy failed'}`)
      }

      setBulkResults([...results])
    }

    setBulkDeploying(false)
    setBulkProgress(null)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Landing Pages</h1>
          <p className="text-sm text-white/40 mt-1">
            {filtered.length} of {dealerships.length} site{dealerships.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'all' | 'dealership' | 'gym' | 'insurance')}
            className="text-sm font-medium text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-2.5 rounded-lg transition-all appearance-none cursor-pointer outline-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
          >
            <option value="all" style={{ background: '#111' }}>All Sites</option>
            <option value="dealership" style={{ background: '#111' }}>Dealerships</option>
            <option value="gym" style={{ background: '#111' }}>Gyms</option>
            <option value="insurance" style={{ background: '#111' }}>Insurance</option>
          </select>
          <button
            onClick={handleRedeployAll}
            disabled={bulkDeploying || loading || dealerships.length === 0}
            className="text-sm font-semibold text-white/80 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] px-4 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkDeploying ? 'Redeploying All...' : 'Redeploy All'}
          </button>
          <button
            onClick={handleNewManual}
            className="text-sm font-medium text-white/50 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-4 py-2.5 rounded-lg transition-all"
          >
            + Manual
          </button>
          <button
            onClick={() => { setShowScraper(true); setScrapeUrl(''); setScrapeError(''); setScrapeData(null) }}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20 flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Scrape Website
          </button>
        </div>
      </div>

      {(bulkDeploying || bulkResults.length > 0) && (
        <div className="mb-6 bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
          {bulkProgress && (
            <p className="text-sm text-white/70 mb-2">
              Redeploying {bulkProgress.current}/{bulkProgress.total}: <span className="text-white">{bulkProgress.subdomain}</span>
            </p>
          )}
          {bulkResults.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-white/50 mb-2">
                Completed: {bulkResults.filter(r => r.success).length} success, {bulkResults.filter(r => !r.success).length} failed
              </p>
              <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                {bulkResults.map((r) => (
                  <div key={r.subdomain} className="text-xs">
                    <span className={r.success ? 'text-emerald-400' : 'text-red-400'}>
                      {r.success ? 'OK' : 'FAIL'}
                    </span>
                    <span className="text-white/70"> — {r.subdomain}</span>
                    {!r.success && r.error ? <span className="text-white/40"> ({r.error})</span> : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-[70] space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur ${
                n.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {n.message}
            </div>
          ))}
        </div>
      )}

      {/* Scraper Modal */}
      {showScraper && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="font-semibold text-lg">Import from Website</h2>
                <p className="text-xs text-white/40 mt-0.5">Paste the dealer's website URL and we'll scrape everything</p>
              </div>
              <button onClick={() => setShowScraper(false)} className="text-white/30 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-all">✕</button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Dealer Website URL</label>
                <input
                  className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScrape()}
                  placeholder="https://www.cloningertoyota.com"
                  autoFocus
                />
              </div>
              {scrapeError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{scrapeError}</div>
              )}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
                <p className="text-xs text-white/30 leading-relaxed">We'll extract: <span className="text-white/50">dealer name, brand, logo, phone numbers, address, business hours, hero images, and vehicle images.</span> You can review and edit everything before saving.</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowScraper(false)} className="text-sm text-white/40 hover:text-white/60 transition-colors">Cancel</button>
              <button
                onClick={handleScrape}
                disabled={scraping || !scrapeUrl.trim()}
                className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
              >
                {scraping ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" className="opacity-30"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                    Scraping...
                  </>
                ) : 'Scrape & Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dealership Cards */}
      {loading ? (
        <div className="text-center py-20 text-white/30">Loading...</div>
      ) : dealerships.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl">🏢</div>
          <p className="text-white/50 mb-2">No dealerships yet</p>
          <p className="text-white/30 text-sm mb-6">Paste a dealer website URL to get started in seconds.</p>
          <button
            onClick={() => { setShowScraper(true); setScrapeUrl(''); setScrapeError('') }}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all inline-flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Scrape Your First Dealer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="bg-[#141414] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {d.logo_url ? (
                    <img src={d.logo_url} alt="" className="w-10 h-10 rounded-lg bg-white p-1 object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-lg">{d.business_type === 'gym' ? '\uD83C\uDFCB\uFE0F' : d.business_type === 'insurance' ? '\uD83D\uDEE1\uFE0F' : '\uD83C\uDFE2'}</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">{d.dealership_name}</h3>
                    <p className="text-xs text-white/40">{d.brand}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${d.business_type === 'gym' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : d.business_type === 'insurance' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {d.business_type === 'gym' ? 'Gym' : d.business_type === 'insurance' ? 'Insurance' : 'Dealership'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  d.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/30 border border-white/10'
                }`}>
                  {d.is_active ? 'Live' : 'Draft'}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>🌐</span>
                  <a href={`https://${d.subdomain}.visquanta.com`} target="_blank" rel="noopener" className="hover:text-white transition-colors">{d.subdomain}.visquanta.com</a>
                </div>
                {d.address_city && <div className="flex items-center gap-2 text-xs text-white/50"><span>📍</span><span>{d.address_city}, {d.address_state}</span></div>}
                {d.phone_sales && <div className="flex items-center gap-2 text-xs text-white/50"><span>📞</span><span>{d.phone_sales}</span></div>}
                {d.business_type === 'gym' ? (
                  <div className="flex items-center gap-2 text-xs text-white/50"><span>{'\uD83C\uDFCB\uFE0F'}</span><span>{d.services?.length || 0} service{d.services?.length !== 1 ? 's' : ''}</span></div>
                ) : d.business_type === 'insurance' ? (
                  <div className="flex items-center gap-2 text-xs text-white/50"><span>{'\uD83D\uDEE1\uFE0F'}</span><span>{d.insurance_products?.length || 0} product{d.insurance_products?.length !== 1 ? 's' : ''}</span></div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-white/50"><span>{'\uD83D\uDE97'}</span><span>{d.vehicles?.length || 0} vehicle{d.vehicles?.length !== 1 ? 's' : ''}</span></div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: d.primary_color }}></div>
                <span className="text-[11px] text-white/30 font-mono">{d.primary_color}</span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                <button onClick={() => handleEdit(d)} className="flex-1 text-xs font-medium text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg py-2 transition-all">Edit</button>
                <a href={`/preview/${d.subdomain}`} target="_blank" className="flex-1 text-xs font-medium text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg py-2 transition-all text-center">Preview</a>
                <button onClick={() => handleDelete(d.id, d.dealership_name)} className="text-xs font-medium text-red-400/60 hover:text-red-400 bg-red-500/[0.03] hover:bg-red-500/[0.06] border border-red-500/[0.06] rounded-lg py-2 px-3 transition-all">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <DealerForm dealership={editing} scrapeData={scrapeData} onClose={handleFormClose} />}
    </>
  )
}
