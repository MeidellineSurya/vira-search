'use client'

// src/app/campaigns/page.tsx
// Public campaign board — anyone can browse, must sign up to apply

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Campaign = {
  id: string
  title: string
  description: string
  budget_range: string | null
  timeline: string | null
  niche_tags: string[]
  content_type_tags: string[]
  ideal_follower_min: number | null
  ideal_follower_max: number | null
  created_at: string
}

function fmt(n: number | null): string {
  if (n == null) return ''
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [userId, setUserId]       = useState<string | null>(null)
  const [userRole, setUserRole]   = useState<string | null>(null)
  const [applying, setApplying]   = useState<string | null>(null)
  const [applied, setApplied]     = useState<Set<string>>(new Set())
  const [toast, setToast]         = useState<string | null>(null)

  useEffect(() => {
    // Get auth state
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        // Get role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        setUserRole(profile?.role ?? null)

        // Get existing applications
        if (profile?.role === 'influencer') {
          const res = await fetch('/api/applications')
          const d   = await res.json()
          const ids  = new Set<string>((d.applications ?? []).map((a: { campaigns: { id: string } }) => a.campaigns?.id).filter(Boolean))
          setApplied(ids)
        }
      }
    })

    fetch('/api/campaigns')
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns ?? []); setLoading(false) })
  }, [])

  const handleApply = async (campaignId: string) => {
    if (!userId) { window.location.href = '/signup'; return }
    if (userRole !== 'influencer') {
      showToast('Only influencer accounts can apply to campaigns')
      return
    }

    setApplying(campaignId)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId }),
    })
    const data = await res.json()
    setApplying(null)

    if (res.ok) {
      setApplied(prev => new Set([...prev, campaignId]))
      showToast('Applied! The marketer will review your profile.')
    } else if (res.status === 400 && data.error?.includes('profile')) {
      window.location.href = '/profile'
    } else {
      showToast(data.error ?? 'Something went wrong')
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
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
          <a href="/search"    style={{ color: '#555', textDecoration: 'none' }}>Search</a>
          <a href="/campaigns" style={{ color: '#f0f0f0', textDecoration: 'none' }}>Campaigns</a>
          {userId ? (
            <>
            <a href={userRole === 'marketer' ? '/dashboard' : '/applications'}
            style={{ color: '#555', textDecoration: 'none' }}>
            {userRole === 'marketer' ? 'Dashboard' : 'My applications'}
            </a>
            {userRole === 'influencer' && (
            <a href="/profile" style={{ color: '#555', textDecoration: 'none' }}>Profile</a>
            )}
            <button onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); window.location.href = '/login' }} style={{ background: 'transparent', border: '1px solid #222', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#555', cursor: 'pointer' }}>
            Log out
            </button>
        </>
        ) : (
            <>
              <a href="/login"  style={{ color: '#555', textDecoration: 'none' }}>Log in</a>
              <a href="/signup" style={{
                background: '#f0f0f0', color: '#0a0a0a',
                padding: '6px 14px', borderRadius: 7,
                fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>Sign up</a>
            </>
          )}
        </nav>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px' }}>
            Open campaigns
          </h1>
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>
            Browse brand campaigns looking for influencers. Sign up to apply.
          </p>
        </div>

        {loading ? (
          <p style={{ color: '#444', fontSize: 14 }}>Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <div style={{
            border: '1px dashed #222', borderRadius: 12,
            padding: '64px', textAlign: 'center', color: '#333',
          }}>
            <p style={{ fontSize: 15 }}>No active campaigns yet</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Check back soon or post your own campaign</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map(campaign => {
              const isApplied  = applied.has(campaign.id)
              const isApplying = applying === campaign.id

              return (
                <div key={campaign.id} style={{
                  background: '#111', border: '1px solid #1e1e1e',
                  borderRadius: 12, padding: '24px',
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: '#f0f0f0' }}>
                        {campaign.title}
                      </h2>
                      <p style={{
                        fontSize: 13, color: '#777', margin: '0 0 14px', lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {campaign.description}
                      </p>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                        {campaign.niche_tags?.map(tag => (
                          <span key={tag} style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 20,
                            background: '#1e2a1e', color: '#4ade80', border: '1px solid #2a3a2a',
                          }}>
                            {tag}
                          </span>
                        ))}
                        {campaign.content_type_tags?.map(tag => (
                          <span key={tag} style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 20,
                            background: '#1a1a2a', color: '#818cf8', border: '1px solid #2a2a3a',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Meta */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#555' }}>
                        {campaign.budget_range && <span>💰 {campaign.budget_range}</span>}
                        {campaign.timeline     && <span>📅 {campaign.timeline}</span>}
                        {(campaign.ideal_follower_min || campaign.ideal_follower_max) && (
                          <span>
                            👥 {fmt(campaign.ideal_follower_min)}
                            {campaign.ideal_follower_min && campaign.ideal_follower_max ? '–' : ''}
                            {fmt(campaign.ideal_follower_max)} followers
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Apply button */}
                    <div style={{ flexShrink: 0 }}>
                      <button
                        onClick={() => handleApply(campaign.id)}
                        disabled={isApplied || isApplying}
                        style={{
                          padding: '10px 20px', borderRadius: 8,
                          background: isApplied ? '#0f2a0f' : isApplying ? '#1a1a1a' : '#f0f0f0',
                          color:      isApplied ? '#4ade80'  : isApplying ? '#444'    : '#0a0a0a',
                          border:     isApplied ? '1px solid #1a3a1a' : 'none',
                          fontSize: 13, fontWeight: 700,
                          cursor: isApplied || isApplying ? 'default' : 'pointer',
                          transition: 'all 0.15s', whiteSpace: 'nowrap',
                        }}
                      >
                        {isApplied ? '✓ Applied' : isApplying ? 'Applying…' : !userId ? 'Sign up to apply' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', border: '1px solid #333',
          borderRadius: 10, padding: '12px 20px',
          fontSize: 13, color: '#f0f0f0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}