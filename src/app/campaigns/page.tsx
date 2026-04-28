'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', primaryDark: '#0284C7', accent: '#DDF4FF', bg: '#F8FAFC', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)' }

type Campaign = { id: string; title: string; description: string; budget_range: string | null; timeline: string | null; niche_tags: string[]; content_type_tags: string[]; ideal_follower_min: number | null; ideal_follower_max: number | null; created_at: string }

function fmt(n: number | null) { if (n == null) return ''; if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'; if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'; return n.toString() }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [userId, setUserId]       = useState<string | null>(null)
  const [userRole, setUserRole]   = useState<string | null>(null)
  const [applying, setApplying]   = useState<string | null>(null)
  const [applied, setApplied]     = useState<Set<string>>(new Set())
  const [toast, setToast]         = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
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

  const handleApply = async (campaignId: string) => {
    if (!userId) { window.location.href = '/signup'; return }
    if (userRole !== 'influencer') { showToast('Only influencer accounts can apply to campaigns'); return }
    setApplying(campaignId)
    const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign_id: campaignId }) })
    const data = await res.json()
    setApplying(null)
    if (res.ok) { setApplied(prev => new Set([...prev, campaignId])); showToast('Applied! The marketer will review your profile.') }
    else if (res.status === 400 && data.error?.includes('profile')) { window.location.href = '/profile' }
    else showToast(data.error ?? 'Something went wrong')
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.surface, position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ textDecoration: 'none' }}><span style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: s.primary }}>VIRA</span></a>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13 }}>
          <a href="/search" style={{ color: s.muted, textDecoration: 'none' }}>Search</a>
          <a href="/campaigns" style={{ color: s.primary, textDecoration: 'none', fontWeight: 600 }}>Campaigns</a>
          {userId ? (
            <>
              <a href={userRole === 'marketer' ? '/dashboard' : '/applications'} style={{ color: s.muted, textDecoration: 'none' }}>{userRole === 'marketer' ? 'Dashboard' : 'My applications'}</a>
              {userRole === 'influencer' && <a href="/profile" style={{ color: s.muted, textDecoration: 'none' }}>Profile</a>}
              <button onClick={async () => { await createClient().auth.signOut(); window.location.href = '/login' }} style={{ background: 'transparent', border: `1.5px solid ${s.border}`, borderRadius: 7, padding: '5px 14px', fontSize: 12, color: s.muted, cursor: 'pointer' }}>Log out</button>
            </>
          ) : (
            <>
              <a href="/login" style={{ color: s.muted, textDecoration: 'none' }}>Log in</a>
              <a href="/signup" style={{ padding: '7px 18px', borderRadius: 7, background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Sign up</a>
            </>
          )}
        </nav>
      </div>

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
              const isApplied = applied.has(campaign.id)
              const isApplying = applying === campaign.id
              return (
                <div key={campaign.id} style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: '24px', boxShadow: s.shadow, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = s.primaryLight)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = s.border)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: s.text }}>{campaign.title}</h2>
                      <p style={{ fontSize: 13, color: s.muted, margin: '0 0 14px', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {campaign.description}
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {campaign.niche_tags?.map(tag => <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: s.accent, color: s.primaryDark, fontWeight: 600 }}>{tag}</span>)}
                        {campaign.content_type_tags?.map(tag => <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>{tag}</span>)}
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: s.muted }}>
                        {campaign.budget_range && <span>💰 {campaign.budget_range}</span>}
                        {campaign.timeline && <span>📅 {campaign.timeline}</span>}
                        {(campaign.ideal_follower_min || campaign.ideal_follower_max) && <span>👥 {fmt(campaign.ideal_follower_min)}{campaign.ideal_follower_min && campaign.ideal_follower_max ? '–' : ''}{fmt(campaign.ideal_follower_max)} followers</span>}
                      </div>
                    </div>
                    <button onClick={() => handleApply(campaign.id)} disabled={isApplied || isApplying} style={{
                      padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: isApplied || isApplying ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: 'none', transition: 'all 0.15s',
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

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: s.text, borderRadius: 10, padding: '12px 20px', fontSize: 13, color: '#fff', boxShadow: '0 8px 32px rgba(30,41,59,0.2)', zIndex: 100, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}