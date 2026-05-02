'use client'

// src/app/campaigns/[id]/page.tsx
// Public shareable campaign page — no auth required to view.
// Influencers can apply from here. URL is shareable externally.

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/Nav'

const s = {
  primary: '#0EA5E9', primaryLight: '#38BDF8', primaryDark: '#0284C7',
  accent: '#DDF4FF', bg: '#F8FAFC', border: '#E2E8F0',
  text: '#1E293B', muted: '#64748B', faint: '#94A3B8',
  surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)',
}

type Campaign = {
  id: string; title: string; description: string; status: string
  budget_range: string | null; timeline: string | null
  niche_tags: string[]; content_type_tags: string[]
  ideal_follower_min: number | null; ideal_follower_max: number | null
  created_at: string
}

function fmt(n: number | null) {
  if (!n) return ''
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

export default function CampaignDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [campaign, setCampaign]   = useState<Campaign | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  // Auth state
  const [userId, setUserId]       = useState<string | null>(null)
  const [userRole, setUserRole]   = useState<string | null>(null)

  // Apply modal state
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail]         = useState('')
  const [applying, setApplying]   = useState(false)
  const [applied, setApplied]     = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  // Copy link state
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    // Get auth
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        // Pre-fill email from auth
        setEmail(data.user.email ?? '')
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        setUserRole(profile?.role ?? null)
        // Check if already applied
        if (profile?.role === 'influencer') {
          const res = await fetch('/api/applications')
          const d = await res.json()
          const ids = (d.applications ?? []).map((a: { campaigns: { id: string } }) => a.campaigns?.id)
          if (ids.includes(id)) setApplied(true)
        }
      }
    })

    // Fetch campaign
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.campaign) { setNotFound(true); setLoading(false); return }
        setCampaign(d.campaign)
        setLoading(false)
      })
  }, [id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApplyClick = () => {
    if (!userId) { window.location.href = `/signup?redirect=/campaigns/${id}`; return }
    if (userRole !== 'influencer') return
    setShowModal(true)
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setApplyError('Email is required'); return }
    setApplying(true); setApplyError(null)

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, contact_email: email.trim() }),
    })
    const data = await res.json()
    setApplying(false)

    if (res.ok) {
      setApplied(true)
      setShowModal(false)
    } else if (res.status === 400 && data.error?.includes('profile')) {
      window.location.href = '/profile'
    } else {
      setApplyError(data.error ?? 'Something went wrong')
    }
  }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: '#fff',
    border: `1.5px solid ${s.border}`, borderRadius: 8, padding: '11px 14px',
    fontSize: 14, color: s.text, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif' }}>
      <Nav active="campaigns" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: s.faint }}>Loading…</p>
      </div>
    </div>
  )

  if (notFound || !campaign) return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif' }}>
      <Nav active="campaigns" />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: s.text, marginBottom: 12 }}>Campaign not found</h1>
        <p style={{ fontSize: 14, color: s.muted, marginBottom: 24 }}>This campaign may have been closed or the link is incorrect.</p>
        <a href="/campaigns" style={{ color: s.primary, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>← Browse all campaigns</a>
      </div>
    </div>
  )

  const isClosed = campaign.status === 'closed'

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <Nav active="campaigns" />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

        {/* Back link */}
        <a href="/campaigns" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← All campaigns</a>

        {/* Header card */}
        <div style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '32px', marginBottom: 16, boxShadow: s.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{campaign.title}</h1>
                {isClosed && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#F1F5F9', color: s.muted, border: `1px solid ${s.border}`, fontWeight: 600 }}>Closed</span>
                )}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {campaign.niche_tags?.map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: s.accent, color: s.primaryDark, fontWeight: 600 }}>{tag}</span>
                ))}
                {campaign.content_type_tags?.map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: s.muted }}>
                {campaign.budget_range && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>💰</span> {campaign.budget_range}
                  </span>
                )}
                {campaign.timeline && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>📅</span> {campaign.timeline}
                  </span>
                )}
                {(campaign.ideal_follower_min || campaign.ideal_follower_max) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>👥</span>
                    {fmt(campaign.ideal_follower_min)}{campaign.ideal_follower_min && campaign.ideal_follower_max ? '–' : ''}{fmt(campaign.ideal_follower_max)} followers
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {!isClosed && (
                <button onClick={handleApplyClick} disabled={applied} style={{
                  padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: 'none', cursor: applied ? 'default' : 'pointer', fontFamily: 'inherit',
                  background: applied ? '#DCFCE7' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
                  color: applied ? '#15803D' : '#fff',
                  boxShadow: applied ? 'none' : '0 4px 16px rgba(14,165,233,0.35)',
                  transition: 'all 0.2s',
                }}>
                  {applied ? '✓ Applied' : !userId ? 'Sign up to apply' : userRole === 'marketer' ? 'Marketer account' : 'Apply now'}
                </button>
              )}

              {/* Share button */}
              <button onClick={handleCopyLink} style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${copied ? s.primary : s.border}`,
                background: copied ? s.accent : 'transparent',
                color: copied ? s.primaryDark : s.muted,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              }}>
                {copied ? '✓ Link copied!' : '🔗 Copy link'}
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '28px 32px', boxShadow: s.shadow }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Campaign brief</h2>
          <p style={{ fontSize: 15, color: s.text, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{campaign.description}</p>
        </div>

        {/* Closed notice */}
        {isClosed && (
          <div style={{ marginTop: 16, padding: '14px 20px', background: '#F1F5F9', border: `1px solid ${s.border}`, borderRadius: 10, fontSize: 13, color: s.muted }}>
            This campaign is no longer accepting applications.
          </div>
        )}

        {/* Not logged in CTA */}
        {!userId && !isClosed && (
          <div style={{ marginTop: 16, padding: '20px 24px', background: s.accent, border: `1.5px solid ${s.primaryLight}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: s.primaryDark, margin: '0 0 2px' }}>Want to apply?</p>
              <p style={{ fontSize: 13, color: s.primary, margin: 0 }}>Create a free influencer account to apply in seconds.</p>
            </div>
            <a href={`/signup?redirect=/campaigns/${id}`} style={{ padding: '10px 22px', borderRadius: 8, background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 10px rgba(14,165,233,0.3)', whiteSpace: 'nowrap' }}>
              Sign up free
            </a>
          </div>
        )}
      </div>

      {/* Apply modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(30,41,59,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Apply to campaign</h2>
            <p style={{ fontSize: 14, color: s.muted, margin: '0 0 24px' }}>
              Enter your contact email so the marketer can reach you if selected.
            </p>

            <form onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Contact email *
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@example.com" style={input}
                  onFocus={e => (e.target.style.borderColor = s.primary)}
                  onBlur={e => (e.target.style.borderColor = s.border)}
                />
                <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>
                  Only shared with the marketer if they select you. Not publicly visible.
                </p>
              </div>

              {applyError && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{applyError}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={applying} style={{
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
    </div>
  )
}