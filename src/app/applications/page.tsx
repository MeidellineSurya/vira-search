'use client'

// src/app/applications/page.tsx
// Influencer's application dashboard — track status of all campaigns applied to

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Campaign = {
  id: string
  title: string
  description: string
  budget_range: string | null
  timeline: string | null
  niche_tags: string[]
  status: string
}

type Application = {
  id: string
  status: 'pending' | 'viewed' | 'selected' | 'passed'
  applied_at: string
  ai_fit_score: number | null
  campaigns: Campaign
}

function statusInfo(status: string): { label: string; color: string; bg: string; border: string; desc: string } {
  const map: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
    pending:  { label: 'Pending',  color: '#888',    bg: '#1a1a1a', border: '#222',    desc: 'Waiting for the marketer to review' },
    viewed:   { label: 'Viewed',   color: '#60a5fa', bg: '#0a1a2a', border: '#0a2a3a', desc: 'The marketer has seen your profile' },
    selected: { label: 'Selected', color: '#4ade80', bg: '#0f2a0f', border: '#1a3a1a', desc: 'The marketer wants to move forward — expect a message' },
    passed:   { label: 'Passed',   color: '#ef4444', bg: '#2a0a0a', border: '#3a1a1a', desc: 'Not selected for this campaign' },
  }
  return map[status] ?? map.pending
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(d => {
        if (d) { setApplications(d.applications ?? []); setLoading(false) }
      })
  }, [router])

  const counts = {
    pending:  applications.filter(a => a.status === 'pending').length,
    viewed:   applications.filter(a => a.status === 'viewed').length,
    selected: applications.filter(a => a.status === 'selected').length,
    passed:   applications.filter(a => a.status === 'passed').length,
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif', color: '#f0f0f0',
    }}>
      {/* Nav */}
      <div style={{
        borderBottom: '1px solid #1a1a1a', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>VIRA</span>
        <nav style={{ display: 'flex', gap: 24, fontSize: 13, alignItems: 'center' }}>
            <a href="/campaigns"    style={{ color: '#555', textDecoration: 'none' }}>Campaigns</a>
            <a href="/applications" style={{ color: '#555', textDecoration: 'none' }}>My applications</a>
            <a href="/profile"      style={{ color: '#f0f0f0', textDecoration: 'none' }}>Profile</a>
            <button onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); window.location.href = '/login' }} style={{ background: 'transparent', border: '1px solid #222', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#555', cursor: 'pointer' }}>
                Log out
            </button>
        </nav>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 6px' }}>
          My applications
        </h1>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 32px' }}>
          Track the status of campaigns you've applied to.
        </p>

        {/* Stats */}
        {applications.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            {[
              { label: 'Pending',  value: counts.pending,  color: '#888' },
              { label: 'Viewed',   value: counts.viewed,   color: '#60a5fa' },
              { label: 'Selected', value: counts.selected, color: '#4ade80' },
              { label: 'Passed',   value: counts.passed,   color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#111', border: '1px solid #1e1e1e',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <p style={{ fontSize: 10, color: '#555', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ color: '#444', fontSize: 14 }}>Loading…</p>
        ) : applications.length === 0 ? (
          <div style={{
            border: '1px dashed #222', borderRadius: 12,
            padding: '64px', textAlign: 'center', color: '#333',
          }}>
            <p style={{ fontSize: 15, marginBottom: 16 }}>No applications yet</p>
            <a href="/campaigns" style={{
              display: 'inline-block',
              background: '#f0f0f0', color: '#0a0a0a',
              padding: '10px 20px', borderRadius: 8,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              Browse campaigns
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {applications.map(app => {
              const info    = statusInfo(app.status)
              const campaign = app.campaigns

              return (
                <div key={app.id} style={{
                  background: '#111', border: '1px solid #1e1e1e',
                  borderRadius: 12, padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f0f0f0' }}>
                          {campaign.title}
                        </h2>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                          background: info.bg, color: info.color, border: `1px solid ${info.border}`,
                        }}>
                          {info.label}
                        </span>
                      </div>

                      <p style={{ fontSize: 12, color: '#555', margin: '0 0 8px' }}>
                        {info.desc}
                      </p>

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: '#555' }}>
                        {campaign.budget_range && <span>💰 {campaign.budget_range}</span>}
                        {campaign.timeline     && <span>📅 {campaign.timeline}</span>}
                        <span>Applied {new Date(app.applied_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {app.ai_fit_score !== null && (
                      <div style={{
                        flexShrink: 0, textAlign: 'center',
                        padding: '10px 14px', borderRadius: 8,
                        background: '#0a0a0a', border: '1px solid #1e1e1e',
                      }}>
                        <p style={{ fontSize: 10, color: '#555', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Fit
                        </p>
                        <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: app.ai_fit_score >= 75 ? '#22c55e' : app.ai_fit_score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {app.ai_fit_score}
                        </p>
                      </div>
                    )}
                  </div>

                  {app.status === 'selected' && (
                    <div style={{
                      marginTop: 14, padding: '12px 14px',
                      background: '#0f2a0f', border: '1px solid #1a3a1a',
                      borderRadius: 8, fontSize: 13, color: '#4ade80',
                    }}>
                      🎉 You've been selected! The marketer will contact you externally via email or Instagram DM.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}