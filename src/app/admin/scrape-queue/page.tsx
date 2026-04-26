// src/app/admin/scrape-queue/page.tsx
// Simple admin page to view pending scrape requests.
// Protected by ADMIN_SECRET — only accessible if you know the secret.
// Visit: /admin/scrape-queue?secret=YOUR_ADMIN_SECRET

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type ScrapeRequest = {
  id: string
  ig_handle: string
  status: string
  note: string | null
  created_at: string
}

function ScrapeQueue() {
  const params  = useSearchParams()
  const secret  = params.get('secret') ?? ''

  const [requests, setRequests] = useState<ScrapeRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [linking, setLinking]   = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/scrape-queue', {
      headers: { 'x-admin-secret': secret },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setRequests(d.requests ?? [])
        setLoading(false)
      })
  }, [secret])

  const handleLink = async (handle: string) => {
    setLinking(handle)
    const res = await fetch('/api/admin/link-scraped', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ ig_handle: handle }),
    })
    const data = await res.json()
    setLinking(null)

    if (res.ok) {
      setRequests(prev => prev.map(r =>
        r.ig_handle === handle ? { ...r, status: 'done' } : r
      ))
      showToast(`✓ @${handle} linked — ${data.applications_scored} application(s) scored`)
    } else {
      showToast(`Error: ${data.error}`)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const done    = requests.filter(r => r.status === 'done')

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0',
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif', padding: '48px 32px',
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px' }}>
        VIRA Admin — Scrape Queue
      </h1>
      <p style={{ fontSize: 13, color: '#555', margin: '0 0 32px' }}>
        Influencers who signed up without matching scraped data.
      </p>

      {loading && <p style={{ color: '#444' }}>Loading…</p>}
      {error   && <p style={{ color: '#ef4444' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Pending */}
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#d4a847', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pending ({pending.length})
          </h2>

          {pending.length === 0 ? (
            <p style={{ color: '#444', fontSize: 13, marginBottom: 32 }}>No pending requests 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              {pending.map(r => (
                <div key={r.id} style={{
                  background: '#111', border: '1px solid #1e1e1e',
                  borderRadius: 10, padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
                      <a href={`https://instagram.com/${r.ig_handle}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#f0f0f0', textDecoration: 'none' }}>
                        @{r.ig_handle} ↗
                      </a>
                    </p>
                    <p style={{ fontSize: 12, color: '#555', margin: 0 }}>
                      Requested {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Steps reminder */}
                    <div style={{ fontSize: 11, color: '#555', textAlign: 'right', lineHeight: 1.6 }}>
                      1. Scrape on Apify<br/>
                      2. Insert into <code style={{ color: '#888' }}>influencers</code> table<br/>
                      3. Click Link ↓
                    </div>

                    <button
                      onClick={() => handleLink(r.ig_handle)}
                      disabled={linking === r.ig_handle}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: linking === r.ig_handle ? '#1a1a1a' : '#0f2a0f',
                        border: '1px solid #1a3a1a',
                        color: linking === r.ig_handle ? '#444' : '#4ade80',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {linking === r.ig_handle ? 'Linking…' : 'Link & score'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Done */}
          {done.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#555', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Done ({done.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {done.map(r => (
                  <div key={r.id} style={{
                    background: '#0f0f0f', border: '1px solid #1a1a1a',
                    borderRadius: 8, padding: '12px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, color: '#555' }}>@{r.ig_handle}</span>
                    <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✓ Done</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', border: '1px solid #333',
          borderRadius: 10, padding: '12px 20px',
          fontSize: 13, color: '#f0f0f0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default function ScrapeQueuePage() {
  return (
    <Suspense>
      <ScrapeQueue />
    </Suspense>
  )
}