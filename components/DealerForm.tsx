'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Dealership, Vehicle, GymService, InsuranceProduct } from '@/lib/supabase'
import { generateSmsTemplates } from '@/lib/sms-templates'
import { BUSINESS_TYPE_OPTIONS, businessTypeLabel, isGymBusiness, isInsuranceBusiness, isServiceBusiness } from '@/lib/site-niche'

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
const GYM_BRANDS = ['Gym','Fitness Center','Yoga Studio','Pilates Studio','CrossFit Box','Other']
const INSURANCE_BRANDS = ['State Farm','Allstate','GEICO','Progressive','Farmers','Liberty Mutual','Nationwide','USAA','American Family','Erie Insurance','Independent Agency','Other']
const CUSTOM_BRANDS = ['Solar Energy','Disability Services','Travel / Tickets','Professional Services','Home Services','Other']
const VERIFY_POLL_SECONDS = 5
const VERIFY_MAX_ATTEMPTS = 24

type DeployProgress = {
  open: boolean
  phase: 'saving' | 'deploying' | 'verifying' | 'verified' | 'error'
  title: string
  message: string
  attempt?: number
  nextCheckIn?: number
  redirectIn?: number
  liveUrl?: string
}

export default function DealerForm({ dealership, scrapeData, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!dealership
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'details' | 'branding' | 'vehicles' | 'sms' | 'domain'>('details')
  const [dnsStatus, setDnsStatus] = useState<'checking' | 'connected' | 'pending' | null>(null)

  // Build initial form state
  function buildInitialForm() {
    if (dealership) {
      return {
        business_type: dealership.business_type || 'dealership',
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
        services: dealership.services || [] as GymService[],
        insurance_products: dealership.insurance_products || [] as InsuranceProduct[],
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

    const s = scrapeData
    const name = s?.dealership_name || ''
    const brand = s?.brand || 'Other'
    const phone = s?.phone_sales || ''
    const addr = s?.address || {}
    const hours = s?.hours || DEFAULT_HOURS
    const sub = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const legal = `${name} LLC`
    const dba = name
    const email = sub ? `contact@${sub}.visquanta.com` : ''
    const sms = name ? generateSmsTemplates(legal, dba, phone, email) : { sms_consent_text: '', sms_checkbox_label: '', sms_optin_response: '', sms_optout_response: '', sms_help_response: '' }

    return {
      business_type: s?.business_type || 'dealership',
      subdomain: sub,
      dealership_name: name,
      legal_entity_name: legal,
      dba_name: dba,
      brand,
      phone_sales: phone,
      phone_sms_help: '',
      email,
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
      services: (s?.services || []) as GymService[],
      insurance_products: [] as InsuranceProduct[],
      ...sms,
      privacy_effective_date: 'Sep 15, 2025',
      terms_effective_date: 'Sep 15, 2025',
      page_title: name ? `Book Your Appointment | ${name}` : '',
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

  // ============================================
  // REACTIVE AUTO-POPULATE
  // When key fields change, cascade updates downstream
  // ============================================

  // When dealership_name changes → update subdomain, legal, dba, page_title, maps, email, SMS
  function handleNameChange(name: string) {
    const sub = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const legal = `${name} LLC`
    const dba = name
    const email = sub ? `contact@${sub}.visquanta.com` : ''
    const sms = name ? generateSmsTemplates(legal, dba, form.phone_sms_help || form.phone_sales, email) : {}
    const addr = [form.address_line1, form.address_city, form.address_state, form.address_zip].filter(Boolean).join(', ')

    setForm(f => ({
      ...f,
      dealership_name: name,
      subdomain: sub,
      legal_entity_name: legal,
      dba_name: dba,
      email,
      page_title: `Book Your Appointment | ${name}`,
      maps_url: `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + (f.address_city || ''))}`,
      address_full: addr || f.address_full,
      ...sms,
    }))
  }

  // When subdomain changes → update email, SMS help response
  function handleSubdomainChange(sub: string) {
    const clean = sub.toLowerCase().replace(/[^a-z0-9-]/g, '')
    const email = clean ? `contact@${clean}.visquanta.com` : ''
    const sms = form.dealership_name ? generateSmsTemplates(
      form.legal_entity_name, form.dba_name || form.dealership_name,
      form.phone_sms_help || form.phone_sales, email
    ) : {}

    setForm(f => ({ ...f, subdomain: clean, email, ...sms }))
  }

  // When legal entity changes → update SMS copy
  function handleLegalChange(legal: string) {
    const sms = generateSmsTemplates(legal, form.dba_name || form.dealership_name, form.phone_sms_help || form.phone_sales, form.email)
    setForm(f => ({ ...f, legal_entity_name: legal, ...sms }))
  }

  // When DBA changes → update SMS copy
  function handleDbaChange(dba: string) {
    const sms = generateSmsTemplates(form.legal_entity_name, dba, form.phone_sms_help || form.phone_sales, form.email)
    setForm(f => ({ ...f, dba_name: dba, ...sms }))
  }

  // When phone changes → update SMS help response
  function handlePhoneChange(phone: string) {
    const sms = generateSmsTemplates(form.legal_entity_name, form.dba_name || form.dealership_name, form.phone_sms_help || phone, form.email)
    setForm(f => ({ ...f, phone_sales: phone, ...sms }))
  }

  // When SMS help phone changes → update SMS help response
  function handleSmsPhoneChange(phone: string) {
    const sms = generateSmsTemplates(form.legal_entity_name, form.dba_name || form.dealership_name, phone || form.phone_sales, form.email)
    setForm(f => ({ ...f, phone_sms_help: phone, ...sms }))
  }

  // When address fields change → update address_full and maps
  function handleAddressChange(key: string, value: string) {
    setForm(f => {
      const updated = { ...f, [key]: value }
      const addr = [updated.address_line1, updated.address_city, updated.address_state, updated.address_zip].filter(Boolean).join(', ')
      return {
        ...updated,
        address_full: addr,
        maps_url: `https://maps.google.com/?q=${encodeURIComponent(f.dealership_name + ' ' + (key === 'address_city' ? value : f.address_city || ''))}`,
      }
    })
  }

  // Vehicle management
  function addVehicle() { set('vehicles', [...form.vehicles, { name: '', type: '', price: '', image_url: '' }]) }
  function updateVehicle(idx: number, key: keyof Vehicle, value: string) {
    const v = [...form.vehicles]; v[idx] = { ...v[idx], [key]: value }; set('vehicles', v)
  }
  function removeVehicle(idx: number) { set('vehicles', form.vehicles.filter((_: any, i: number) => i !== idx)) }

  // Service management (gym)
  function addService() { set('services', [...form.services, { name: '', description: '' }]) }
  function updateService(idx: number, key: keyof GymService, value: string) {
    const s = [...form.services]; s[idx] = { ...s[idx], [key]: value }; set('services', s)
  }
  function removeService(idx: number) { set('services', form.services.filter((_: any, i: number) => i !== idx)) }

  // Insurance product management
  function addInsuranceProduct() { set('insurance_products', [...form.insurance_products, { name: '', description: '', type: '' }]) }
  function updateInsuranceProduct(idx: number, key: keyof InsuranceProduct, value: string) {
    const p = [...form.insurance_products]; p[idx] = { ...p[idx], [key]: value }; set('insurance_products', p)
  }
  function removeInsuranceProduct(idx: number) { set('insurance_products', form.insurance_products.filter((_: any, i: number) => i !== idx)) }

  // Deploy status
  const [domainError, setDomainError] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<any>(null)
  const [deployProgress, setDeployProgress] = useState<DeployProgress | null>(null)

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function countdown(seconds: number) {
    for (let remaining = seconds; remaining > 0; remaining--) {
      setDeployProgress(prev => prev ? { ...prev, nextCheckIn: remaining } : prev)
      await sleep(1000)
    }
  }

  async function redirectTo10Dlc(liveUrl: string) {
    for (let remaining = 3; remaining > 0; remaining--) {
      setDeployProgress({
        open: true,
        phase: 'verified',
        title: 'Domain verified',
        message: 'The landing page is live. Taking you to the 10DLC campaign dashboard.',
        redirectIn: remaining,
        liveUrl,
      })
      await sleep(1000)
    }
    router.push('/dashboard/10dlc')
  }

  async function pollDeployVerification() {
    if (!form.subdomain) return null

    for (let attempt = 1; attempt <= VERIFY_MAX_ATTEMPTS; attempt++) {
      setDeployProgress({
        open: true,
        phase: 'verifying',
        title: 'Verifying domain',
        message: 'Vercel is checking the Cloudflare DNS records. This usually clears within a minute or two.',
        attempt,
        nextCheckIn: VERIFY_POLL_SECONDS,
        liveUrl: `https://${form.subdomain}.visquanta.com`,
      })

      const res = await fetch(`/api/deploy?subdomain=${form.subdomain}`)
      const data = await res.json()
      setDeployResult(data)

      if (data.deployed && data.domain?.verified) {
        setDnsStatus('connected')
        return data
      }

      setDnsStatus('pending')
      await countdown(VERIFY_POLL_SECONDS)
    }

    return null
  }

  // Check deploy status via new deploy API
  async function checkDns() {
    if (!form.subdomain) return
    setDnsStatus('checking')
    setDomainError(null)
    try {
      const res = await fetch(`/api/deploy?subdomain=${form.subdomain}`)
      const data = await res.json()
      if (data.deployed) {
        setDnsStatus(data.domain?.verified ? 'connected' : 'pending')
        setDeployResult(data)
      } else {
        setDnsStatus(null)
      }
    } catch {
      setDnsStatus('pending')
    }
  }

  // Deploy as standalone Vercel project
  async function deployDealer() {
    if (!form.subdomain) return
    setDeploying(true)
    setDnsStatus('checking')
    setDomainError(null)
    setDeployProgress({
      open: true,
      phase: 'saving',
      title: 'Saving page data',
      message: 'Saving the latest fields before generating the static site.',
      liveUrl: `https://${form.subdomain}.visquanta.com`,
    })
    try {
      // Must save first
      const method = isEdit ? 'PUT' : 'POST'
      const body = isEdit ? { ...form, id: dealership!.id } : form
      const saveRes = await fetch('/api/dealerships', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const saveData = await saveRes.json()
      if (saveData.error) {
        setDomainError(`Save failed: ${saveData.error}`)
        setDeployProgress({
          open: true,
          phase: 'error',
          title: 'Save failed',
          message: saveData.error,
          liveUrl: `https://${form.subdomain}.visquanta.com`,
        })
        setDeploying(false)
        setDnsStatus(null)
        return
      }

      // Now deploy
      setDeployProgress({
        open: true,
        phase: 'deploying',
        title: 'Deploying static site',
        message: 'Generating the site, deploying it to Vercel, and preparing the domain.',
        liveUrl: `https://${form.subdomain}.visquanta.com`,
      })
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: form.subdomain }),
      })
      const data = await res.json()
      if (data.success) {
        setDeployResult(data)
        setDnsStatus(data.domain?.verified ? 'connected' : 'pending')
        if (data.domain?.verified) {
          await redirectTo10Dlc(data.liveUrl)
        } else {
          const verified = await pollDeployVerification()
          if (verified?.domain?.verified) {
            await redirectTo10Dlc(verified.liveUrl)
          } else {
            setDeployProgress({
              open: true,
              phase: 'error',
              title: 'Verification still pending',
              message: 'The site deployed, but Vercel has not confirmed the domain yet. You can leave this open or press Check Deploy Status again in a minute.',
              liveUrl: data.liveUrl,
            })
          }
        }
      } else {
        setDomainError(data.error || 'Deploy failed')
        setDeployProgress({
          open: true,
          phase: 'error',
          title: 'Deploy failed',
          message: data.error || 'Deploy failed',
          liveUrl: `https://${form.subdomain}.visquanta.com`,
        })
        setDnsStatus(null)
      }
    } catch (e: any) {
      setDomainError(e.message)
      setDeployProgress({
        open: true,
        phase: 'error',
        title: 'Deploy failed',
        message: e.message,
        liveUrl: `https://${form.subdomain}.visquanta.com`,
      })
      setDnsStatus(null)
    }
    setDeploying(false)
  }

  // Save only (no deploy)
  async function handleSave() {
    setSaving(true)
    try {
      const method = isEdit ? 'PUT' : 'POST'
      const body = isEdit ? { ...form, id: dealership!.id } : form
      const res = await fetch('/api/dealerships', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) { alert(`Error: ${data.error}`); setSaving(false); return }
      onClose()
    } catch (e: any) { alert(`Error: ${e.message}`) }
    setSaving(false)
  }

  // Scraped images for picker
  const scrapedImages = [
    ...(scrapeData?.hero_images || []),
    ...(scrapeData?.vehicle_images || []),
    ...(scrapeData?.all_images || []),
  ].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)

  const inputClass = 'w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none transition-all'
  const labelClass = 'block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5'
  const TABS = ['details', 'branding', 'vehicles', 'sms', 'domain'] as const
  const isGymType = isGymBusiness(form.business_type)
  const isInsuranceType = isInsuranceBusiness(form.business_type)
  const isServiceType = isServiceBusiness(form.business_type)
  const typeLabel = businessTypeLabel(form.business_type)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="font-semibold text-lg">{isEdit ? 'Edit' : 'New'} {typeLabel}</h2>
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
              <p className="text-xs text-emerald-400/60">All fields auto-update as you edit. Review and save when ready.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-all capitalize ${tab === t ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'}`}>
              {t === 'sms' ? 'SMS / Legal' : t === 'domain' ? '\uD83C\uDF10 Domain' : t === 'vehicles' ? (isServiceType ? 'Services' : isInsuranceType ? 'Products' : 'Vehicles') : t}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ==================== DETAILS TAB ==================== */}
          {tab === 'details' && (
            <>
              <div>
                <label className={labelClass}>Industry / Niche</label>
                <input
                  className={inputClass}
                  list="business-type-options"
                  value={form.business_type}
                  onChange={e => set('business_type', e.target.value)}
                  placeholder="dealership, solar, disability, travel..."
                />
                <datalist id="business-type-options">
                  {BUSINESS_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{isGymType ? 'Business Name' : isInsuranceType ? 'Agency Name' : isServiceType ? 'Business Name' : 'Dealership Name'} *</label>
                  <input className={inputClass} value={form.dealership_name}
                    onChange={e => isEdit ? set('dealership_name', e.target.value) : handleNameChange(e.target.value)}
                    placeholder={isGymType ? 'Body Kinetics' : isInsuranceType ? 'Smith Insurance Group' : isServiceType ? 'Acme Solar' : 'Cloninger Toyota'} />
                </div>
                <div>
                  <label className={labelClass}>{isGymType ? 'Type' : isInsuranceType ? 'Carrier / Network' : isServiceType ? 'Category' : 'Brand'} *</label>
                  <input
                    className={inputClass}
                    list="brand-options"
                    value={form.brand}
                    onChange={e => set('brand', e.target.value)}
                    placeholder={isServiceType ? typeLabel : 'Other'}
                  />
                  <datalist id="brand-options">
                    {(isGymType ? GYM_BRANDS : isInsuranceType ? INSURANCE_BRANDS : isServiceType ? CUSTOM_BRANDS : BRANDS).map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Subdomain *</label>
                  <div className="flex items-center gap-0">
                    <input className={`${inputClass} rounded-r-none`} value={form.subdomain}
                      onChange={e => isEdit ? set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) : handleSubdomainChange(e.target.value)}
                      placeholder="cloningertoyota" />
                    <span className="bg-white/[0.03] border border-l-0 border-white/[0.08] rounded-r-lg px-3 py-2.5 text-xs text-white/30 whitespace-nowrap">.visquanta.com</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Legal Entity Name</label>
                  <input className={inputClass} value={form.legal_entity_name}
                    onChange={e => handleLegalChange(e.target.value)}
                    placeholder="Auto-generated" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>DBA Name</label>
                  <input className={inputClass} value={form.dba_name || ''}
                    onChange={e => handleDbaChange(e.target.value)}
                    placeholder="Same as dealership name" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input className={inputClass} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="Auto-generated" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone (Sales)</label>
                  <input className={inputClass} value={form.phone_sales || ''}
                    onChange={e => handlePhoneChange(e.target.value)} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className={labelClass}>Phone (SMS Help)</label>
                  <input className={inputClass} value={form.phone_sms_help || ''}
                    onChange={e => handleSmsPhoneChange(e.target.value)} placeholder="Optional — defaults to sales" />
                </div>
              </div>
              <hr className="border-white/[0.06]" />
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Address</p>
              <div>
                <label className={labelClass}>Street Address</label>
                <input className={inputClass} value={form.address_line1 || ''}
                  onChange={e => handleAddressChange('address_line1', e.target.value)} placeholder="511 Jake Alexander Blvd S" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelClass}>City</label><input className={inputClass} value={form.address_city || ''} onChange={e => handleAddressChange('address_city', e.target.value)} placeholder="Salisbury" /></div>
                <div><label className={labelClass}>State</label><input className={inputClass} value={form.address_state || ''} onChange={e => handleAddressChange('address_state', e.target.value)} placeholder="NC" /></div>
                <div><label className={labelClass}>ZIP</label><input className={inputClass} value={form.address_zip || ''} onChange={e => handleAddressChange('address_zip', e.target.value)} placeholder="28147" /></div>
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

          {/* ==================== BRANDING TAB ==================== */}
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

              {scrapedImages.length > 0 && (
                <>
                  <hr className="border-white/[0.06]" />
                  <div>
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Scraped Images — click to use</p>
                    <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                      {scrapedImages.map((src: string, i: number) => (
                        <div key={i} className="relative group cursor-pointer" onClick={() => {
                          if (!form.hero_bg_image || form.hero_bg_image === src) set('hero_bg_image', src)
                          else if (!form.hero_card_image || form.hero_card_image === src) set('hero_card_image', src)
                          else set('hero_bg_image', src)
                        }}>
                          <img src={src} alt="" className="w-full h-20 object-cover rounded-lg border border-white/[0.06] group-hover:border-red-500/50 transition-all" loading="lazy"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all">Use</span>
                          </div>
                          {(form.hero_bg_image === src || form.hero_card_image === src || form.logo_url === src) && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/20 mt-2">Click to set as hero background, click another for hero card.</p>
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

          {/* ==================== VEHICLES / SERVICES TAB ==================== */}
          {tab === 'vehicles' && isServiceType && (
            <>
              <p className="text-xs text-white/40">Add services, consultations, or booking categories to feature on the landing page.</p>
              {form.services.map((s: GymService, idx: number) => (
                <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/40">Service {idx + 1}</span>
                    <button onClick={() => removeService(idx)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Remove</button>
                  </div>
                  <div>
                    <label className={labelClass}>Service Name</label>
                    <input className={inputClass} value={s.name} onChange={e => updateService(idx, 'name', e.target.value)} placeholder={isGymType ? 'Group Fitness' : 'Consultation'} />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input className={inputClass} value={s.description} onChange={e => updateService(idx, 'description', e.target.value)} placeholder={isGymType ? 'High-energy classes including HIIT, cycling, yoga, and more.' : 'Tell visitors what this service includes.'} />
                  </div>
                </div>
              ))}
              <button onClick={addService} className="w-full border border-dashed border-white/[0.1] rounded-xl py-3 text-sm text-white/40 hover:text-white/60 hover:border-white/[0.2] transition-all">+ Add Service</button>
            </>
          )}
          {tab === 'vehicles' && isInsuranceType && (
            <>
              <p className="text-xs text-white/40">Add insurance products to feature on the landing page.</p>
              {form.insurance_products.map((p: InsuranceProduct, idx: number) => (
                <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/40">Product {idx + 1}</span>
                    <button onClick={() => removeInsuranceProduct(idx)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Product Name</label>
                      <input className={inputClass} value={p.name} onChange={e => updateInsuranceProduct(idx, 'name', e.target.value)} placeholder="Auto Insurance" />
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <input className={inputClass} value={p.type} onChange={e => updateInsuranceProduct(idx, 'type', e.target.value)} placeholder="Auto • Home • Life • Health" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input className={inputClass} value={p.description} onChange={e => updateInsuranceProduct(idx, 'description', e.target.value)} placeholder="Comprehensive coverage with competitive rates and bundling discounts." />
                  </div>
                </div>
              ))}
              <button onClick={addInsuranceProduct} className="w-full border border-dashed border-white/[0.1] rounded-xl py-3 text-sm text-white/40 hover:text-white/60 hover:border-white/[0.2] transition-all">+ Add Product</button>
            </>
          )}
          {tab === 'vehicles' && !isServiceType && !isInsuranceType && (
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
                </>
              )}
            </>
          )}

          {/* ==================== SMS / LEGAL TAB ==================== */}
          {tab === 'sms' && (
            <>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 mb-2">
                <p className="text-xs text-white/40 leading-relaxed">SMS copy <span className="text-white/60 font-medium">auto-updates</span> when you change the dealership name, legal entity, DBA, or phone numbers in the Details tab.</p>
              </div>
              <div><label className={labelClass}>SMS Consent Disclosure</label><textarea className={`${inputClass} min-h-[100px]`} value={form.sms_consent_text || ''} onChange={e => set('sms_consent_text', e.target.value)} /></div>
              <div><label className={labelClass}>Checkbox Label</label><textarea className={`${inputClass} min-h-[80px]`} value={form.sms_checkbox_label || ''} onChange={e => set('sms_checkbox_label', e.target.value)} /></div>
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

          {/* ==================== DOMAIN TAB ==================== */}
          {tab === 'domain' && (
            <>
              {/* Deploy + Live URL */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Deploy as Standalone Site</p>
                {form.subdomain ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-4 py-3 font-mono text-sm text-white">
                        https://{form.subdomain}.visquanta.com
                      </div>
                      <a href={`https://${form.subdomain}.visquanta.com`} target="_blank"
                        className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg px-4 py-3 text-xs font-medium text-white/60 hover:text-white transition-all whitespace-nowrap">
                        Visit ↗
                      </a>
                    </div>
                    <button onClick={deployDealer}
                      disabled={deploying}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-lg transition-all disabled:opacity-50">
                      {deploying ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" className="opacity-30"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                          Saving &amp; Deploying...
                        </span>
                      ) : dnsStatus === 'connected' ? (
                        '✓ Live — Click to Re-deploy'
                      ) : (
                        '🚀 Save & Deploy to Vercel'
                      )}
                    </button>
                    <p className="text-[10px] text-white/20 mt-2 text-center">{'Saves data -> generates static HTML -> creates Vercel project -> configures Cloudflare DNS'}</p>
                    {dnsStatus === 'connected' && (
                      <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span>
                        {form.subdomain}.visquanta.com is live
                        {deployResult?.deployment?.url && (
                          <span className="text-white/20 ml-2">({deployResult.deployment.url})</span>
                        )}
                      </p>
                    )}
                    {dnsStatus === 'pending' && (
                      <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-amber-400 rounded-full inline-block"></span>
                        Deployed — domain may take a few minutes to propagate
                      </p>
                    )}
                    {domainError && (
                      <p className="text-xs text-red-400 mt-2">{domainError}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/30">Set a subdomain in the Details tab first.</p>
                )}
              </div>

              {/* Check Status */}
              {form.subdomain && (
                <div className="flex gap-3">
                  <button onClick={checkDns}
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white text-xs font-medium py-2.5 rounded-lg transition-all">
                    🔍 Check Deploy Status
                  </button>
                  <a href={`/preview/${form.subdomain}`} target="_blank"
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white text-xs font-medium py-2.5 rounded-lg transition-all text-center">
                    👁 Preview (Dashboard)
                  </a>
                </div>
              )}

              {/* Deployment details */}
              {deployResult && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Deployment Details</p>
                  <div className="space-y-3">
                    {[
                      ['Vercel Project', deployResult.project?.name || '—'],
                      ['Project ID', deployResult.project?.id || '—'],
                      ['Deployment URL', deployResult.deployment?.url || '—'],
                      ['Domain', deployResult.domain?.name || '—'],
                      ['Domain Verified', deployResult.domain?.verified ? '✓ Yes' : '⏳ Pending'],
                      ['Cloudflare DNS', deployResult.domain?.dns?.configured ? 'Configured' : deployResult.domain?.dns?.skipped ? 'Skipped' : deployResult.domain?.dns?.error ? 'Error' : '—'],
                      ['Status', deployResult.deployment?.readyState || '—'],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex items-start gap-3">
                        <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider w-32 shrink-0 pt-0.5">{label}</span>
                        <span className="text-xs text-white/60 break-all font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Architecture info */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">How It Works</p>
                <div className="space-y-2 text-xs text-white/40 leading-relaxed">
                  <p><span className="text-white/60 font-medium">1.</span> Each dealer gets its own <span className="text-white/50">standalone Vercel project</span> (vq-{'{subdomain}'})</p>
                  <p><span className="text-white/60 font-medium">2.</span> A complete static HTML file is generated with all data baked in — <span className="text-white/50">zero runtime dependencies</span></p>
                  <p><span className="text-white/60 font-medium">3.</span> {'{subdomain}'}.visquanta.com is added as the project domain</p>
                  <p><span className="text-white/60 font-medium">4.</span> Cloudflare gets the Vercel-recommended CNAME plus any required <code className="text-white/50">_vercel</code> TXT verification record automatically</p>
                  <p className="text-white/20 pt-2">Each site is fully independent — no shared infrastructure, no database calls at runtime.</p>
                </div>
              </div>

              {/* Env var info */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-amber-400/60 uppercase tracking-widest mb-2">Required Env Vars</p>
                <div className="space-y-1 text-xs text-white/30 font-mono">
                  <p>VERCEL_TOKEN=<span className="text-white/50">your-vercel-api-token</span></p>
                  <p>VERCEL_TEAM_ID=<span className="text-white/50">your-team-id (optional)</span></p>
                  <p>CLOUDFLARE_API_TOKEN=<span className="text-white/50">your-cloudflare-api-token</span></p>
                  <p>CLOUDFLARE_ZONE_ID=<span className="text-white/50">visquanta.com zone id</span></p>
                </div>
                <p className="text-[10px] text-white/20 mt-2">Get token from vercel.com/account/tokens</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="text-sm text-white/40 hover:text-white/60 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.dealership_name || !form.subdomain}
            className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20 disabled:opacity-50 disabled:transform-none"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : `Create ${typeLabel}`}
          </button>
        </div>
      </div>

      {deployProgress?.open && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[#101010] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`relative w-16 h-16 rounded-full border flex items-center justify-center shrink-0 ${
                  deployProgress.phase === 'verified'
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                    : deployProgress.phase === 'error'
                      ? 'border-red-400/40 bg-red-400/10 text-red-300'
                      : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                }`}>
                  {deployProgress.phase === 'verified' ? (
                    <span className="text-2xl font-semibold">✓</span>
                  ) : deployProgress.phase === 'error' ? (
                    <span className="text-2xl font-semibold">!</span>
                  ) : deployProgress.phase === 'verifying' && deployProgress.nextCheckIn ? (
                    <span className="text-xl font-semibold tabular-nums">{deployProgress.nextCheckIn}</span>
                  ) : (
                    <svg className="animate-spin w-7 h-7" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" className="opacity-25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2">
                    {deployProgress.phase === 'verified' ? 'Ready for 10DLC' : deployProgress.phase === 'error' ? 'Needs attention' : 'Deployment progress'}
                  </p>
                  <h3 className="text-lg font-semibold text-white mb-2">{deployProgress.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{deployProgress.message}</p>
                  {deployProgress.liveUrl && (
                    <p className="mt-4 text-xs text-white/35 font-mono break-all">{deployProgress.liveUrl}</p>
                  )}
                </div>
              </div>

              {deployProgress.phase === 'verifying' && (
                <div className="mt-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-white/40">Verification check</span>
                    <span className="text-white/70 font-mono">{deployProgress.attempt || 1}/{VERIFY_MAX_ATTEMPTS}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((deployProgress.attempt || 1) / VERIFY_MAX_ATTEMPTS) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/35 mt-3">
                    Next check in <span className="text-amber-300 font-mono">{deployProgress.nextCheckIn || VERIFY_POLL_SECONDS}s</span>
                  </p>
                </div>
              )}

              {deployProgress.phase === 'verified' && (
                <div className="mt-6 bg-emerald-400/[0.06] border border-emerald-400/15 rounded-xl p-4">
                  <p className="text-sm text-emerald-200">
                    Opening the 10DLC dashboard in <span className="font-mono">{deployProgress.redirectIn || 1}</span> seconds.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
              {deployProgress.phase === 'error' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDeployProgress(null)}
                    className="text-sm text-white/45 hover:text-white/70 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={checkDns}
                    className="text-sm font-semibold text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] px-4 py-2 rounded-lg transition-all"
                  >
                    Check Status
                  </button>
                </>
              ) : deployProgress.phase === 'verified' ? (
                <>
                  <a
                    href={deployProgress.liveUrl}
                    target="_blank"
                    className="text-sm text-white/45 hover:text-white/70 transition-colors"
                  >
                    View Site
                  </a>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/10dlc')}
                    className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all"
                  >
                    Go to 10DLC
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-white/30">Keep this window open while verification completes.</span>
                  <button
                    type="button"
                    onClick={() => setDeployProgress(null)}
                    className="text-sm text-white/45 hover:text-white/70 transition-colors"
                  >
                    Hide
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
