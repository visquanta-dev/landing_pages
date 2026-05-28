'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'vq-age-confirmed-ccw'
const MINIMUM_AGE = 21

function calculateAge(month: string, day: string, year: string) {
  const m = Number(month)
  const d = Number(day)
  const y = Number(year)
  if (!m || !d || !y || y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null

  const birth = new Date(y, m - 1, d)
  if (birth.getFullYear() !== y || birth.getMonth() !== m - 1 || birth.getDate() !== d) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export default function AgeGate({ brandColor = '#D4132A' }: { brandColor?: string }) {
  const [state, setState] = useState<'loading' | 'gate' | 'blocked' | 'passed'>('loading')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'yes') {
        setState('passed')
        return
      }
    } catch {}
    setState('gate')
  }, [])

  useEffect(() => {
    if (state !== 'gate' && state !== 'blocked') return

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [state])

  function verifyBirthdate(e: React.FormEvent) {
    e.preventDefault()

    const age = calculateAge(birthMonth, birthDay, birthYear)
    if (age === null) {
      setError('Enter a valid date of birth.')
      return
    }

    if (age < MINIMUM_AGE) {
      setState('blocked')
      return
    }

    try { window.localStorage.setItem(STORAGE_KEY, 'yes') } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    setState('passed')
    setError('')
  }

  if (state === 'loading' || state === 'passed') return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483646,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: "'Outfit', sans-serif", color: '#E8E8E8',
      }}
    >
      <div style={{
        maxWidth: 520, width: '100%',
        background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
        padding: 40, textAlign: 'center',
      }}>
        {state === 'gate' ? (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: brandColor, marginBottom: 16 }}>Age Verification</p>
            <h2 id="age-gate-title" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.2 }}>Enter your date of birth</h2>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: '#A0A0A0', marginBottom: 32 }}>
              This site provides information and assistance related to concealed carry weapon (CCW) permits and firearms-related services. You must be at least 21 years of age to access this content.
            </p>
            <form onSubmit={verifyBirthdate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ textAlign: 'left' }}>
                <label id="age-gate-birthdate-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>Date of birth</label>
                <div aria-labelledby="age-gate-birthdate-label" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 10 }}>
                  {[
                    { label: 'MM', value: birthMonth, setter: setBirthMonth, maxLength: 2 },
                    { label: 'DD', value: birthDay, setter: setBirthDay, maxLength: 2 },
                    { label: 'YYYY', value: birthYear, setter: setBirthYear, maxLength: 4 },
                  ].map((field) => (
                    <input
                      key={field.label}
                      aria-label={field.label === 'MM' ? 'Birth month' : field.label === 'DD' ? 'Birth day' : 'Birth year'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={field.label}
                      value={field.value}
                      maxLength={field.maxLength}
                      onChange={(e) => {
                        field.setter(e.target.value.replace(/\D/g, '').slice(0, field.maxLength))
                        setError('')
                      }}
                      style={{
                        width: '100%', padding: '15px 16px', background: '#090909',
                        border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 10, color: '#FAFAFA', fontFamily: "'Outfit', sans-serif",
                        fontSize: 16, outline: 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
              {error && <p role="alert" style={{ margin: 0, textAlign: 'left', fontSize: 13, color: '#FCA5A5' }}>{error}</p>}
              <button
                type="submit"
                style={{
                  width: '100%', padding: 18, background: brandColor, color: '#FFFFFF',
                  border: 'none', borderRadius: 10, fontFamily: "'Outfit', sans-serif",
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}
              >
                Verify Age
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: brandColor, marginBottom: 16 }}>Access Restricted</p>
            <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.2 }}>Please come back when you&rsquo;re 21.</h2>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: '#A0A0A0' }}>
              Access to this site is restricted to persons 21 years of age or older. Thank you for your understanding.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
