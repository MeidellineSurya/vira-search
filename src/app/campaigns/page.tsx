'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/Nav'

const s = {
  primary: '#0EA5E9', primaryLight: '#38BDF8', primaryDark: '#0284C7',
  accent: '#DDF4FF', bg: '#F8FAFC', border: '#E2E8F0',
  text: '#1E293B', muted: '#64748B', faint: '#94A3B8',
  surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)',
}

type Campaign = {
  id: string; title: string; description: string
  budget_range: string | null; timeline: string | null
  niche_tags: string[]; content_type_tags: string[]
  ideal_follower_min: number | null; ideal_follower_max: number | null
}

function fmt(n: number | null) {
  if (!n) return ''
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns]       = useState<Campaign[]>([])
  const [loading, setLoading]           = useState(true)
  const [userId, setUserId]             = useState<string | null>(null)
  const [userRole, setUserRole]         = useState<string | null>(null)
  const [applying, setApplying]         = useState<string | null>(null)
  const [applied, setApplied]           = useState<Set<string>>(new Set())
  const [toast, setToast]               = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal]         = useState(false)
  const [modalCampaignId, setModalId]     = useState<string | null>(null)
  const [contactEmail, setContactEmail]   = useState('')
  const [applicantNote, setApplicantNote] = useState('')
  const [applyError, setApplyError]       = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        setContactEmail(data.user.email ?? '')
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        setUserRole(profile?.role ?? null)
        if (profile?.role === 'influencer') {
          const res = await fetch('/api/applications')
          const d = await res.json()
          setApplied(new Set((d.applications ?? []).map((a: { campaigns: { id: string } }) => a.campaigns?.id).filter(Boolean)))
        }
      }
    })
    fetch('/api/campaigns').then(r => r.json()).then(d => { setCampaigns(d.campaigns ?? []); setLoading(false) })
  }, [])

  const handleApply = (campaignId: string) => {
    if (!userId) { window.location.href = '/signup'; return }
    if (userRole !== 'influencer') { showToastMsg('Only influencer accounts can apply to campaigns'); return }
    if (applied.has(campaignId)) return
    setModalId(campaignId)
    setApplicantNote('')
    setApplyError(null)
    setShowModal(true)
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactEmail.trim()) { setApplyError('Email is required'); return }
    if (!modalCampaignId) return
    setApplying(modalCampaignId); setApplyError(null)

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id:    modalCampaignId,
        contact_email:  contactEmail.trim(),
        applicant_note: applicantNote.trim() || null,
      }),
    })
    const data = await res.json()
    setApplying(null)

    if (res.ok) {
      setApplied(prev => new Set([...prev, modalCampaignId]))
      setShowModal(false)
      showToastMsg('Applied! The marketer will review your profile.')
    } else if (res.status === 400 && data.error?.includes('profile')) {
      window.location.href = '/profile'
    } else {
      setApplyError(data.error ?? 'Something went wrong')
    }
  }

  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: '#fff',
    border: `1.5px solid ${s.border}`, borderRadius: 8, padding: '11px 14px',
    fontSize: 14, color: s.text, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <Nav active="campaigns" />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Open campaigns</h1>
          <p style={{ fontSize: 14, color: s.muted, margin: 0 }}>Browse brand campaigns looking for influencers. Sign up to apply.</p>
        </div>

        {loading ? (
          <p style={{ color: s.faint, fontSize: 14 }}>Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <div style={{ border: `2px dashed ${s.border}`, borderRadius: 14, padding: '64px', textAlign: 'center', color: s.muted }}>
            <p style={{ fontSize: 15 }}>No active campaigns yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map(campaign => {
              const isApplied  = applied.has(campaign.id)
              const isApplying = applying === campaign.id
              return (
                <div key={campaign.id} style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: '24px', boxShadow: s.shadow, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = s.primaryLight)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = s.border)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={`/campaigns/${campaign.id}`} style={{ textDecoration: 'none' }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: s.text, transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = s.primary)}
                          onMouseLeave={e => (e.currentTarget.style.color = s.text)}>
                          {campaign.title}
                        </h2>
                      </a>
                      <p style={{ fontSize: 13, color: s.muted, margin: '0 0 14px', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {campaign.description}
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {campaign.niche_tags?.map(tag => (
                          <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: s.accent, color: s.primaryDark, fontWeight: 600 }}>{tag}</span>
                        ))}
                        {campaign.content_type_tags?.map(tag => (
                          <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: s.muted }}>
                        {campaign.budget_range && <span>💰 {campaign.budget_range}</span>}
                        {campaign.timeline && <span>📅 {campaign.timeline}</span>}
                        {(campaign.ideal_follower_min || campaign.ideal_follower_max) && (
                          <span>👥 {fmt(campaign.ideal_follower_min)}{campaign.ideal_follower_min && campaign.ideal_follower_max ? '–' : ''}{fmt(campaign.ideal_follower_max)} followers</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleApply(campaign.id)} disabled={isApplied || isApplying} style={{
                      padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                      cursor: isApplied || isApplying ? 'default' : 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0, border: 'none',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                      background: isApplied ? '#DCFCE7' : isApplying ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
                      color: isApplied ? '#15803D' : isApplying ? s.faint : '#fff',
                      boxShadow: isApplied || isApplying ? 'none' : '0 2px 12px rgba(14,165,233,0.3)',
                    }}>
                      {isApplied ? '✓ Applied' : isApplying ? 'Applying…' : !userId ? 'Sign up to apply' : 'Apply'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Apply modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(30,41,59,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: s.text }}>Apply to campaign</h2>
            <p style={{ fontSize: 14, color: s.muted, margin: '0 0 24px' }}>
              Add your contact details and any notes for the marketer.
            </p>
            <form onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Contact email */}
              <div>
                <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Contact email *
                </label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required placeholder="you@example.com" style={input}
                  onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
                <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>
                  Only shared with the marketer if they select you.
                </p>
              </div>

              {/* Applicant note */}
              <div>
                <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Note to marketer <span style={{ color: s.faint, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea
                  value={applicantNote}
                  onChange={e => setApplicantNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. I'm available weekdays between 10am–4pm. Happy to visit the venue on short notice. I specialise in food photography and short-form video…"
                  style={{ ...input, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = s.primary)}
                  onBlur={e => (e.target.style.borderColor = s.border)}
                />
                <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>
                  Use this to share your availability, content style, or anything relevant to this campaign.
                </p>
              </div>

              {applyError && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{applyError}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={!!applying} style={{
                  flex: 1, padding: '12px', border: 'none', borderRadius: 8,
                  background: applying ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
                  color: applying ? s.faint : '#fff', fontSize: 14, fontWeight: 700,
                  cursor: applying ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: applying ? 'none' : '0 2px 12px rgba(14,165,233,0.3)',
                }}>
                  {applying ? 'Applying…' : 'Submit application'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '12px 20px', borderRadius: 8, border: `1.5px solid ${s.border}`,
                  background: 'transparent', color: s.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: s.text, borderRadius: 10, padding: '12px 20px', fontSize: 13, color: '#fff', boxShadow: '0 8px 32px rgba(30,41,59,0.2)', zIndex: 100, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
