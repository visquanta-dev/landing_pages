'use client'

import { useState, useEffect } from 'react'
import type { Dealership, Vehicle } from '@/lib/supabase'
import { generateSmsTemplates, generateDerivedFields } from '@/lib/sms-templates'

type Props = {
  dealership: Dealership | null
  scrapeData: any | null
  onClose: () => void
}

const DEFAULT_HOURS: Record<string, string> = {
  monday: '9:00 AM – 8:00 PM', tuesday: '9:00 AM – 8:00 PM', wednesday: '9:00 AM – 8:00 PM',
  thursday: '9:00 AM – 8:00 PM', friday: '9:00 AM – 8:00 PM', saturday: '9:00 AM – 6:00 PM', sunday: 'Closed',
}

const BRANDS = ['Toyota','Ford','Chevrolet','Honda','Hyundai','Kia','Nissan','Volkswagen','Genesis','BMW','Mercedes-Benz','Audi','Lexus','Jeep','Ram','Dodge','Subaru','Mazda','Other']

export default function DealerForm({ dealership, scrapeData, onClose }: Props) {
  const isEdit = !!dealership
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'details' | 'branding' | 'vehicles' | 'sms'>('details')

  // Build initial form state from scrape data or existing dealership
  function buildInitialForm() {
    if (dealership) {
      return {
        subdomain: dealership.subdomain || '',
        dealership_name: dealership.dealership_name || '',
        legal_entity_name: dealership.legal_entity_name || '',
        dba_name: dealership.dba_name || '',
        brand: dealership.brand || 'Toyota',
        phone_sales: dealership.phone_sales || '',
        phone_sms_help: dealership.phone_sms_help || '',
        email: dealership.email || '',
        address_line1: dealership.address_line1 || '',
        address_city: dealership.address_city || '',
        address_state: dealership.address_state || '',
        address_zip: dealership.address_zip || '',
        address_full: dealership.address_full || '',
        hours: dealership.hours || DEFAULT_HOURS,
        logo_url: dealership.logo_url || '',
        primary_color: dealership.primary_color || '#D4132A',
        hero_bg_image: dealership.hero_bg_image || '',
        hero_card_image: dealership.hero_card_image || '',
        vehicles: dealership.vehicles || [],
        sms_consent_text: dealership.sms_consent_text || '',
        sms_checkbox_label: dealership.sms_checkbox_label || '',
        sms_optin_response: dealership.sms_optin_response || '',
        sms_optout_response: dealership.sms_optout_response || '',
        sms_help_response: dealership.sms_help_response || '',
        privacy_effective_date: dealership.privacy_effective_date || 'Sep 15, 2025',
        terms_effective_date: dealership.terms_effective_date || 'Sep 15, 2025',
        page_title: dealership.page_title || '',
        maps_url: dealership.maps_url || '',
        is_active: dealership.is_active ?? true,
      }
    }

    // Pre-populate from scrape
    const s = scrapeData
    const name = s?.dealership_name || ''
    const brand = s?.brand || 'Other'
    const phone = s?.phone_sales || ''
    const addr = s?.address || {}
    const hours = s?.hours || DEFAULT_HOURS

    // Auto-derive fields
    const derived = name ? generateDerivedFields(name) : { legal_entity_name: '', dba_name: '', subdomain: '', page_title: '', email: '' }

    // Auto-generate SMS from derived names
    const sms = name ? generateSmsTemplates(derived.legal_entity_name, derived.dba_name, phone, derived.email) : { sms_consent_text: '', sms_checkbox_label: '', sms_optin_response: '', sms_optout_response: '', sms_help_response: '' }

    return {
      subdomain: derived.subdomain,
      dealership_name: name,
      legal_entity_name: derived.legal_entity_name,
      dba_name: derived.dba_name,
      brand,
      phone_sales: phone,
      phone_sms_help: '',
      email: derived.email,
      address_line1: addr.line1 || '',
      address_city: addr.city || '',
      address_state: addr.state || '',
      address_zip: addr.zip || '',
      address_full: addr.full || '',
      hours,
      logo_url: s?.logo_url || '',
      primary_color: '#D4132A',
      hero_bg_image: s?.hero_images?.[0] || '',
      hero_card_image: s?.hero_images?.[1] || s?.hero_images?.[0] || '',
      vehicles: [] as Vehicle[],
      ...sms,
      privacy_effective_date: 'Sep 15, 2025',
      terms_effective_date: 'Sep 15, 2025',
      page_title: derived.page_title,
      maps_url: name ? `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + (addr.city || ''))}` : '',
      is_active: true,
    }
  }

  const [form, setForm] = useState(buildInitialForm)

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setHour(day: string, value: string) {
    setForm(f => ({ ...f, hours: { ...f.hours, [day]: value } }))
  }

  // Regenerate SMS whenever names change
  function regenerateSms() {
    const legal = form.legal_entity_name || `${form.dealership_name} LLC`
    const dba = form.dba_name || form.dealership_name
    const sms = generateSmsTemplates(legal, dba, form.phone_sms_help || form.phone_sales, form.email)
    setForm(f => ({ ...f, ...sms }))
  }

  // Regenerate derived fields from name
  function regenerateDerived() {
    const name = form.dealership_name
    if (!name) return
    const derived = generateDerivedFields(name, form.legal_entity_name, form.dba_name)
    const sms = generateSmsTemplates(derived.legal_entity_name, derived.dba_name, form.phone_sms_help || form.phone_sales, derived.email)
    const addr = [form.address_line1, form.address_city, form.address_state, form.address_zip].filter(Boolean).join(', ')
    setForm(f => ({
      ...f,
      subdomain: f.subdomain || derived.subdomain,
      legal_entity_name: derived.legal_entity_name,
      dba_name: derived.dba_name,
      email: f.email || derived.email,
      page_title: derived.page_title,
      address_full: addr || f.address_full,
      maps_url: f.maps_url || `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + (f.address_city || ''))}`,
      ...sms,
    }))
  }

  // Vehicle management
  function addVehicle() { set('vehicles', [...form.vehicles, { name: '', type: '', price: '', image_url: '' }]) }
  function updateVehicle(idx: number, key: keyof Vehicle, value: string) {
    const v = [...form.vehicles]; v[idx] = { ...v[idx], [key]: value }; set('vehicles', v)
  }
  function removeVehicle(idx: number) { set('vehicles', form.vehicles.filter((_: any, i: number) => i !== idx)) }

  async function handleSave() {
    setSaving(true)
    try {
      // Ensure SMS is populated
      if (!form.sms_consent_text && form.dealership_name) regenerateSms()

      const method = isEdit ? 'PUT' : 'POST'
      const body = isEdit ? { ...form, id: dealership!.id } : form
      const res = await fetch('/api/dealerships', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) alert(`Error: ${data.error}`)
      else onClose()
    } catch (e: any) { alert(`Error: ${e.message}`) }
    setSaving(false)
  }

  // Scraped images for picker
  const scrapedImages = [
    ...(scrapeData?.hero_images || []),
    ...(scrapeData?.vehicle_images || []),
    ...(scrapeData?.all_images || []),
  ].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) // dedupe

  const inputClass = 'w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none transition-all'
  const labelClass = 'block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="font-semibold text-lg">{isEdit ? 'Edit' : 'New'} Dealership</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {isEdit ? `Editing ${dealership!.dealership_name}` : scrapeData ? `Imported from ${scrapeData.source_url}` : 'Manual entry'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-all">✕</button>
        </div>

        {/* Scrape success banner */}
        {scrapeData && !isEdit && (
          <div className="mx-6 mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-emerald-400 text-lg">✓</span>
            <div>
              <p className="text-sm text-emerald-300 font-medium">Website scraped successfully</p>
              <p className="text-xs text-emerald-400/60">Review the data below, tweak anything that needs fixing, then save. SMS copy is auto-generated.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(['details', 'branding', 'vehicles', 'sms'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-all capitalize ${tab === t ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'}`}>
              {t === 'sms' ? 'SMS / Legal' : t}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {tab === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Dealership Name *</label>
                  <input className={inputClass} value={form.dealership_name} onChange={e => set('dealership_name', e.target.value)} placeholder="Cloninger Toyota" />
                </div>
                <div>
                  <label className={labelClass}>Brand *</label>
                  <select className={inputClass} value={form.brand} onChange={e => set('brand', e.target.value)}>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Subdomain *</label>
                  <div className="flex items-center gap-0">
                    <input className={`${inputClass} rounded-r-none`} value={form.subdomain} onChange={e => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="cloningertoyota" />
                    <span className="bg-white/[0.03] border border-l-0 border-white/[0.08] rounded-r-lg px-3 py-2.5 text-xs text-white/30 whitespace-nowrap">.visquanta.com</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Legal Entity Name</label>
                  <input className={inputClass} value={form.legal_entity_name} onChange={e => set('legal_entity_name', e.target.value)} placeholder="Auto-generated on save" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>DBA Name</label>
                  <input className={inputClass} value={form.dba_name || ''} onChange={e => set('dba_name', e.target.value)} placeholder="Same as dealership name" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input className={inputClass} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="Auto-generated" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone (Sales)</label>
                  <input className={inputClass} value={form.phone_sales || ''} onChange={e => set('phone_sales', e.target.value)} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className={labelClass}>Phone (SMS Help)</label>
                  <input className={inputClass} value={form.phone_sms_help || ''} onChange={e => set('phone_sms_help', e.target.value)} placeholder="Optional — defaults to sales" />
                </div>
              </div>
              <hr className="border-white/[0.06]" />
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Address</p>
              <div>
                <label className={labelClass}>Street Address</label>
                <input className={inputClass} value={form.address_line1 || ''} onChange={e => set('address_line1', e.target.value)} placeholder="511 Jake Alexander Blvd S" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelClass}>City</label><input className={inputClass} value={form.address_city || ''} onChange={e => set('address_city', e.target.value)} placeholder="Salisbury" /></div>
                <div><label className={labelClass}>State</label><input className={inputClass} value={form.address_state || ''} onChange={e => set('address_state', e.target.value)} placeholder="NC" /></div>
                <div><label className={labelClass}>ZIP</label><input className={inputClass} value={form.address_zip || ''} onChange={e => set('address_zip', e.target.value)} placeholder="28147" /></div>
              </div>
              <hr className="border-white/[0.06]" />
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Business Hours</p>
              <div className="space-y-2">
                {Object.entries(form.hours).map(([day, time]) => (
                  <div key={day} className="grid grid-cols-[120px_1fr] gap-3 items-center">
                    <span className="text-sm text-white/50 capitalize">{day}</span>
                    <input className={inputClass} value={time as string} onChange={e => setHour(day, e.target.value)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'branding' && (
            <>
              <div>
                <label className={labelClass}>Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primary_color} onChange={e => set('primary_color', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-white/[0.08]" />
                  <input className={inputClass} value={form.primary_color} onChange={e => set('primary_color', e.target.value)} placeholder="#D4132A" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Logo URL</label>
                <input className={inputClass} value={form.logo_url || ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
                {form.logo_url && <img src={form.logo_url} alt="" className="mt-2 h-12 bg-white rounded-lg p-1 object-contain" />}
              </div>
              <div>
                <label className={labelClass}>Hero Background Image</label>
                <input className={inputClass} value={form.hero_bg_image || ''} onChange={e => set('hero_bg_image', e.target.value)} placeholder="https://..." />
                {form.hero_bg_image && <img src={form.hero_bg_image} alt="" className="mt-2 h-32 w-full object-cover rounded-lg border border-white/[0.06]" />}
              </div>
              <div>
                <label className={labelClass}>Hero Card Image</label>
                <input className={inputClass} value={form.hero_card_image || ''} onChange={e => set('hero_card_image', e.target.value)} placeholder="https://..." />
                {form.hero_card_image && <img src={form.hero_card_image} alt="" className="mt-2 h-32 w-full object-cover rounded-lg border border-white/[0.06]" />}
              </div>

              {/* Scraped image picker */}
              {scrapedImages.length > 0 && (
                <>
                  <hr className="border-white/[0.06]" />
                  <div>
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Scraped Images — click to use</p>
                    <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                      {scrapedImages.map((src: string, i: number) => (
                        <div key={i} className="relative group cursor-pointer" onClick={() => {
                          // Cycle through: first click = hero bg, second = hero card, third = logo
                          if (!form.hero_bg_image || form.hero_bg_image === src) set('hero_bg_image', src)
                          else if (!form.hero_card_image || form.hero_card_image === src) set('hero_card_image', src)
                          else set('hero_bg_image', src)
                        }}>
                          <img src={src} alt="" className="w-full h-20 object-cover rounded-lg border border-white/[0.06] group-hover:border-red-500/50 transition-all" loading="lazy"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all">Use</span>
                          </div>
                          {/* Show indicator if image is selected */}
                          {(form.hero_bg_image === src || form.hero_card_image === src || form.logo_url === src) && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/20 mt-2">Click an image to set as hero background. Click another to set as hero card.</p>
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Google Maps URL</label>
                <input className={inputClass} value={form.maps_url || ''} onChange={e => set('maps_url', e.target.value)} placeholder="https://maps.google.com/?q=..." />
              </div>
              <div>
                <label className={labelClass}>Page Title (Browser Tab)</label>
                <input className={inputClass} value={form.page_title || ''} onChange={e => set('page_title', e.target.value)} placeholder="Book Your Appointment | Dealer Name" />
              </div>
            </>
          )}

          {tab === 'vehicles' && (
            <>
              <p className="text-xs text-white/40">Add vehicles to feature on the landing page.</p>
              {form.vehicles.map((v: Vehicle, idx: number) => (
                <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/40">Vehicle {idx + 1}</span>
                    <button onClick={() => removeVehicle(idx)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Name</label><input className={inputClass} value={v.name} onChange={e => updateVehicle(idx, 'name', e.target.value)} placeholder="Toyota Camry" /></div>
                    <div><label className={labelClass}>Type</label><input className={inputClass} value={v.type} onChange={e => updateVehicle(idx, 'type', e.target.value)} placeholder="Sedan • Hybrid" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Price</label><input className={inputClass} value={v.price} onChange={e => updateVehicle(idx, 'price', e.target.value)} placeholder="From $29,100" /></div>
                    <div><label className={labelClass}>Image URL</label><input className={inputClass} value={v.image_url} onChange={e => updateVehicle(idx, 'image_url', e.target.value)} placeholder="https://..." /></div>
                  </div>
                  {v.image_url && <img src={v.image_url} alt="" className="h-20 object-contain" />}
                </div>
              ))}
              <button onClick={addVehicle} className="w-full border border-dashed border-white/[0.1] rounded-xl py-3 text-sm text-white/40 hover:text-white/60 hover:border-white/[0.2] transition-all">+ Add Vehicle</button>

              {/* Vehicle images from scrape */}
              {scrapeData?.vehicle_images?.length > 0 && (
                <>
                  <hr className="border-white/[0.06]" />
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Scraped Vehicle Images</p>
                  <div className="grid grid-cols-4 gap-2">
                    {scrapeData.vehicle_images.map((src: string, i: number) => (
                      <img key={i} src={src} alt="" className="w-full h-20 object-cover rounded-lg border border-white/[0.06] cursor-pointer hover:border-red-500/50 transition-all" loading="lazy"
                        onClick={() => { addVehicle(); updateVehicle(form.vehicles.length, 'image_url', src) }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20">Click to add as a new vehicle entry.</p>
                </>
              )}
            </>
          )}

          {tab === 'sms' && (
            <>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 mb-2">
                <p className="text-xs text-white/40 leading-relaxed">SMS copy is <span className="text-white/60 font-medium">auto-generated</span> from the dealership name and legal entity. It uses the same Telnyx-compliant template for every dealer — only the business names are swapped.</p>
              </div>
              <div className="flex justify-end">
                <button onClick={regenerateSms} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">⚡ Regenerate SMS Copy</button>
              </div>
              <div>
                <label className={labelClass}>SMS Consent Disclosure</label>
                <textarea className={`${inputClass} min-h-[100px]`} value={form.sms_consent_text || ''} onChange={e => set('sms_consent_text', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Checkbox Label</label>
                <textarea className={`${inputClass} min-h-[80px]`} value={form.sms_checkbox_label || ''} onChange={e => set('sms_checkbox_label', e.target.value)} />
              </div>
              <hr className="border-white/[0.06]" />
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Telnyx Auto-Responses</p>
              <div><label className={labelClass}>Opt-In Confirmation</label><textarea className={`${inputClass} min-h-[60px]`} value={form.sms_optin_response || ''} onChange={e => set('sms_optin_response', e.target.value)} /></div>
              <div><label className={labelClass}>Opt-Out (STOP) Response</label><textarea className={`${inputClass} min-h-[60px]`} value={form.sms_optout_response || ''} onChange={e => set('sms_optout_response', e.target.value)} /></div>
              <div><label className={labelClass}>HELP Response</label><textarea className={`${inputClass} min-h-[60px]`} value={form.sms_help_response || ''} onChange={e => set('sms_help_response', e.target.value)} /></div>
              <hr className="border-white/[0.06]" />
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Privacy Policy Date</label><input className={inputClass} value={form.privacy_effective_date || ''} onChange={e => set('privacy_effective_date', e.target.value)} /></div>
                <div><label className={labelClass}>Terms & Conditions Date</label><input className={inputClass} value={form.terms_effective_date || ''} onChange={e => set('terms_effective_date', e.target.value)} /></div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="accent-red-500 w-4 h-4" />
                <label htmlFor="isActive" className="text-sm text-white/60">Page is live (publicly accessible)</label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="text-sm text-white/40 hover:text-white/60 transition-colors">Cancel</button>
          <div className="flex gap-3">
            {!isEdit && (
              <button onClick={regenerateDerived} className="text-sm font-medium text-white/50 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-5 py-2.5 rounded-lg transition-all">
                ⚡ Auto-Fill
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !form.dealership_name || !form.subdomain}
              className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20 disabled:opacity-50 disabled:transform-none"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Dealership'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
