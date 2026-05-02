'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', accent: '#DDF4FF', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)' }

type Application = { id: string; status: 'pending' | 'viewed' | 'selected' | 'passed'; applied_at: string; ai_fit_score: number | null; campaigns: { id: string; title: string; budget_range: string | null; timeline: string | null; niche_tags: string[]; status: string } }

function statusInfo(status: string) {
  const map: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
    pending:  { label: 'Pending',  color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', desc: 'Waiting for the marketer to review' },
    viewed:   { label: 'Viewed',   color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', desc: 'The marketer has seen your profile' },
    selected: { label: 'Selected', color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0', desc: 'The marketer wants to move forward — expect a message' },
    passed:   { label: 'Passed',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', desc: 'Not selected for this campaign' },
  }
  return map[status] ?? map.pending
}

function scoreColor(s: number) { return s >= 75 ? '#15803D' : s >= 50 ? '#854D0E' : '#DC2626' }
function scoreBg(s: number)    { return s >= 75 ? '#DCFCE7' : s >= 50 ? '#FEF9C3' : '#FEF2F2' }

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    fetch('/api/applications').then(r => {
      if (r.status === 401) { router.push('/login'); return null }
      return r.json()
    }).then(d => { if (d) { setApplications(d.applications ?? []); setLoading(false) } })
  }, [router])

  const counts = {
    pending:  applications.filter(a => a.status === 'pending').length,
    viewed:   applications.filter(a => a.status === 'viewed').length,
    selected: applications.filter(a => a.status === 'selected').length,
    passed:   applications.filter(a => a.status === 'passed').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <Nav active="applications" />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>My applications</h1>
        <p style={{ fontSize: 14, color: s.muted, margin: '0 0 28px' }}>Track the status of campaigns you've applied to.</p>

        {applications.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            {[{ label: 'Pending', value: counts.pending, color: '#64748B', bg: '#F1F5F9' }, { label: 'Viewed', value: counts.viewed, color: '#1D4ED8', bg: '#EFF6FF' }, { label: 'Selected', value: counts.selected, color: '#15803D', bg: '#DCFCE7' }, { label: 'Passed', value: counts.passed, color: '#DC2626', bg: '#FEF2F2' }].map(st => (
              <div key={st.label} style={{ background: st.bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.border}` }}>
                <p style={{ fontSize: 10, color: st.color, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{st.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: st.color, margin: 0 }}>{st.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? <p style={{ color: s.faint, fontSize: 14 }}>Loading…</p>
        : applications.length === 0 ? (
          <div style={{ border: `2px dashed ${s.border}`, borderRadius: 14, padding: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: s.muted, marginBottom: 16 }}>No applications yet</p>
            <a href="/campaigns" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: '#fff', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Browse campaigns</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {applications.map(app => {
              const info = statusInfo(app.status)
              return (
                <div key={app.id} style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: s.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: s.text }}>{app.campaigns.title}</h2>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: info.bg, color: info.color, border: `1px solid ${info.border}` }}>{info.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: s.muted, margin: '0 0 8px' }}>{info.desc}</p>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: s.faint }}>
                        {app.campaigns.budget_range && <span>💰 {app.campaigns.budget_range}</span>}
                        {app.campaigns.timeline && <span>📅 {app.campaigns.timeline}</span>}
                        <span>Applied {new Date(app.applied_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {app.ai_fit_score !== null && (
                      <div style={{ flexShrink: 0, textAlign: 'center', padding: '10px 14px', borderRadius: 10, background: scoreBg(app.ai_fit_score), border: `1px solid ${s.border}` }}>
                        <p style={{ fontSize: 10, color: scoreColor(app.ai_fit_score), margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Fit</p>
                        <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: scoreColor(app.ai_fit_score) }}>{app.ai_fit_score}</p>
                      </div>
                    )}
                  </div>
                  {app.status === 'selected' && (
                    <div style={{ marginTop: 14, padding: '12px 16px', background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#15803D', fontWeight: 600 }}>
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