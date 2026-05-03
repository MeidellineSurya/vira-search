'use client'

// src/app/admin/flags/page.tsx
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', accent: '#DDF4FF', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)' }

type Flag = { key: string; enabled: boolean; note: string | null; updated_at: string }

const FLAG_META: Record<string, { label: string; desc: string; risk: 'high' | 'medium' }> = {
  ai_summary:    { label: 'AI Summaries',        desc: 'Generate influencer summaries via Groq (llama-3.3-70b). Disable to stop summary generation costs.', risk: 'high' },
  ai_scoring:    { label: 'AI Fit Scoring',      desc: 'Score influencers against campaign briefs via Groq (llama-3.1-8b). Disable to stop scoring costs.', risk: 'high' },
  ai_auto_score: { label: 'Auto-score on apply', desc: 'Automatically score applicants when they apply. Disable if scoring runs too frequently.', risk: 'medium' },
}

function FeatureFlags() {
  const params  = useSearchParams()
  const secret  = params.get('secret') ?? ''
  const [flags, setFlags]       = useState<Flag[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/flags', { headers: { 'x-admin-secret': secret } })
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error); setLoading(false); return }; setFlags(d.flags ?? []); setLoading(false) })
  }, [secret])

  const toggle = async (key: string, current: boolean) => {
    setToggling(key)
    const res = await fetch('/api/admin/flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ key, enabled: !current }),
    })
    const data = await res.json()
    setToggling(null)
    if (res.ok) {
      setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !current, updated_at: new Date().toISOString() } : f))
      showToast(`${key} ${!current ? 'enabled ✓' : 'disabled'}`)
    } else {
      showToast(`Error: ${data.error}`)
    }
  }

  const killAll = async () => {
    if (!confirm('Disable ALL AI features? This stops all Groq API calls immediately.')) return
    for (const f of flags.filter(f => f.enabled)) await toggle(f.key, true)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <div style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.surface }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: s.primary }}>VIRA</span>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
          <a href={`/admin/scrape-queue?secret=${secret}`} style={{ color: s.muted, textDecoration: 'none' }}>Scrape Queue</a>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FEF9C3', color: '#854D0E', border: '1px solid #FEF08A', fontWeight: 600 }}>Admin</span>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px' }}>Feature Flags</h1>
            <p style={{ fontSize: 14, color: s.muted, margin: 0 }}>AI kill switches. Changes take effect within 30 seconds.</p>
          </div>
          {flags.some(f => f.enabled) && (
            <button onClick={killAll} style={{ padding: '9px 18px', borderRadius: 8, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              🔴 Kill all AI
            </button>
          )}
        </div>

        {loading && <p style={{ color: s.faint }}>Loading…</p>}
        {error && <p style={{ color: '#EF4444', fontSize: 13 }}>Error: {error} — check your secret in the URL</p>}

        {!loading && !error && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {flags.map(flag => {
                const meta = FLAG_META[flag.key]
                const isOn = flag.enabled
                const busy = toggling === flag.key
                return (
                  <div key={flag.key} style={{ background: s.surface, border: `1.5px solid ${isOn ? s.border : '#FECACA'}`, borderRadius: 14, padding: '20px 24px', boxShadow: s.shadow, transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{meta?.label ?? flag.key}</h3>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: isOn ? '#DCFCE7' : '#FEF2F2', color: isOn ? '#15803D' : '#DC2626', border: `1px solid ${isOn ? '#BBF7D0' : '#FECACA'}` }}>
                            {isOn ? 'Enabled' : 'Disabled'}
                          </span>
                          {meta?.risk === 'high' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#FEF9C3', color: '#854D0E', border: '1px solid #FEF08A', fontWeight: 600 }}>HIGH COST</span>}
                        </div>
                        <p style={{ fontSize: 13, color: s.muted, margin: '0 0 6px', lineHeight: 1.5 }}>{meta?.desc ?? flag.note}</p>
                        <p style={{ fontSize: 11, color: s.faint, margin: 0 }}>Last updated: {new Date(flag.updated_at).toLocaleString('en-AU')}</p>
                      </div>
                      <div onClick={() => !busy && toggle(flag.key, isOn)} style={{ width: 48, height: 26, borderRadius: 13, background: busy ? '#E2E8F0' : isOn ? s.primary : '#CBD5E1', position: 'relative', cursor: busy ? 'not-allowed' : 'pointer', transition: 'background 0.25s', flexShrink: 0, marginTop: 4 }}>
                        <div style={{ position: 'absolute', top: 3, left: isOn ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 28, padding: '18px 22px', background: s.accent, border: `1.5px solid #BAE6FD`, borderRadius: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: s.primary, margin: '0 0 8px' }}>💡 Cost guide</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#0369A1', lineHeight: 1.9 }}>
                <li>AI summaries: ~$0.001/generation (70b, cached permanently after first run)</li>
                <li>Fit scoring: ~$0.0002/score (8b, cached per campaign+influencer pair)</li>
                <li>Auto-scoring: once per application, uses cache when available</li>
                <li>Disable HIGH COST flags first if you see unexpected Groq charges</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: s.text, borderRadius: 10, padding: '12px 20px', fontSize: 13, color: '#fff', boxShadow: '0 8px 32px rgba(30,41,59,0.2)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default function FlagsPage() {
  return <Suspense><FeatureFlags /></Suspense>
}