'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', accent: '#DDF4FF', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)' }

type ScrapeRequest = { id: string; ig_handle: string; status: string; note: string | null; created_at: string }

function ScrapeQueue() {
  const params  = useSearchParams()
  const secret  = params.get('secret') ?? ''
  const [requests, setRequests] = useState<ScrapeRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [linking, setLinking]   = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/scrape-queue', { headers: { 'x-admin-secret': secret } })
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error); setLoading(false); return }; setRequests(d.requests ?? []); setLoading(false) })
  }, [secret])

  const handleLink = async (handle: string) => {
    setLinking(handle)
    const res = await fetch('/api/admin/link-scraped', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ ig_handle: handle }) })
    const data = await res.json()
    setLinking(null)
    if (res.ok) { setRequests(prev => prev.map(r => r.ig_handle === handle ? { ...r, status: 'done' } : r)); showToast(`✓ @${handle} linked — ${data.applications_scored} application(s) scored`) }
    else showToast(`Error: ${data.error}`)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 5000) }

  const pending = requests.filter(r => r.status === 'pending')
  const done    = requests.filter(r => r.status === 'done')

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Scrape Queue</h1>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FEF9C3', color: '#854D0E', border: '1px solid #FEF08A', fontWeight: 600 }}>Admin</span>
        </div>
        <p style={{ fontSize: 14, color: s.muted, margin: '0 0 36px' }}>Influencers who signed up without matching scraped data.</p>

        {loading && <p style={{ color: s.faint }}>Loading…</p>}
        {error   && <p style={{ color: '#EF4444', fontSize: 13 }}>Error: {error} — check your secret in the URL</p>}

        {!loading && !error && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: pending.length > 0 ? '#854D0E' : '#15803D', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Pending ({pending.length})
              </h2>
            </div>

            {pending.length === 0 ? (
              <div style={{ background: '#DCFCE7', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
                <p style={{ fontSize: 14, color: '#15803D', margin: 0, fontWeight: 600 }}>🎉 No pending requests — all influencers are matched!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
                {pending.map(r => (
                  <div key={r.id} style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, boxShadow: s.shadow }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
                        <a href={`https://instagram.com/${r.ig_handle}`} target="_blank" rel="noopener noreferrer" style={{ color: s.primary, textDecoration: 'none' }}>@{r.ig_handle} ↗</a>
                      </p>
                      <p style={{ fontSize: 12, color: s.faint, margin: 0 }}>
                        Requested {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: s.faint, textAlign: 'right', lineHeight: 1.8 }}>
                        1. Scrape on Apify<br />
                        2. Insert into <code style={{ background: s.accent, padding: '1px 6px', borderRadius: 4, color: s.primary, fontSize: 11 }}>influencers</code> table<br />
                        3. Click Link ↓
                      </div>
                      <button onClick={() => handleLink(r.ig_handle)} disabled={linking === r.ig_handle} style={{ padding: '9px 20px', borderRadius: 8, background: linking === r.ig_handle ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, border: 'none', color: linking === r.ig_handle ? s.faint : '#fff', fontSize: 13, fontWeight: 700, cursor: linking === r.ig_handle ? 'not-allowed' : 'pointer', boxShadow: linking === r.ig_handle ? 'none' : '0 2px 10px rgba(14,165,233,0.3)', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                        {linking === r.ig_handle ? 'Linking…' : 'Link & score'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {done.length > 0 && (
              <>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Done ({done.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {done.map(r => (
                    <div key={r.id} style={{ background: '#F8FAFC', border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: s.muted }}>@{r.ig_handle}</span>
                      <span style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>✓ Done</span>
                    </div>
                  ))}
                </div>
              </>
            )}
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

export default function ScrapeQueuePage() {
  return <Suspense><ScrapeQueue /></Suspense>
}