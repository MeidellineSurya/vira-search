'use client'

// src/app/dashboard/campaigns/[id]/page.tsx
// Applicant review panel — marketer sees all applicants with combined scraped + self profile

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Influencer = {
  id: string
  profile_name: string
  bio: string | null
  followers_count: number | null
  engagement_rate: number | null
  average_likes: number | null
  average_comments: number | null
  instagram_url: string | null
  ai_summary: string | null
}

type InfluencerProfile = {
  id: string
  ig_handle: string | null
  niche_tags: string[] | null
  short_bio: string | null
  audience_location: string | null
  influencers: Influencer | null
}

type Applicant = {
  id: string
  status: 'pending' | 'viewed' | 'selected' | 'passed'
  applied_at: string
  ai_fit_score: number | null
  ai_fit_summary: string | null
  match_reasons: string[] | null
  influencer_profiles: InfluencerProfile | null
}

type Campaign = {
  id: string
  title: string
  description: string
  status: string
  budget_range: string | null
  timeline: string | null
}

function fmt(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function statusBadge(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    pending:  { background: '#1a1a1a', color: '#888',    border: '1px solid #222' },
    viewed:   { background: '#0a1a2a', color: '#60a5fa', border: '1px solid #0a2a3a' },
    selected: { background: '#0f2a0f', color: '#4ade80', border: '1px solid #1a3a1a' },
    passed:   { background: '#2a0a0a', color: '#ef4444', border: '1px solid #3a1a1a' },
  }
  return { ...map[status] ?? map.pending, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }
}

export default function CampaignDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params.id as string

  const [campaign, setCampaign]     = useState<Campaign | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [selected, setSelected]     = useState<Applicant | null>(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<string>('all')

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${id}`).then(r => r.json()),
      fetch(`/api/campaigns/${id}/applicants`).then(r => r.json()),
    ]).then(([cData, aData]) => {
      if (cData.error) { router.push('/dashboard'); return }
      setCampaign(cData.campaign)
      setApplicants(aData.applicants ?? [])
      setLoading(false)
    })
  }, [id, router])

  const updateStatus = async (applicantId: string, status: string) => {
    await fetch(`/api/campaigns/${id}/applicants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicantId, status }),
    })
    setApplicants(prev => prev.map(a =>
      a.id === applicantId ? { ...a, status: status as Applicant['status'] } : a
    ))
    if (selected?.id === applicantId) {
      setSelected(prev => prev ? { ...prev, status: status as Applicant['status'] } : null)
    }
  }

  const filtered = filter === 'all' ? applicants : applicants.filter(a => a.status === filter)

  const inf  = selected?.influencer_profiles
  const scr  = inf?.influencers

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#444', fontFamily: '"DM Sans", sans-serif' }}>Loading…</p>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif', color: '#f0f0f0',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Nav */}
      <div style={{
        borderBottom: '1px solid #1a1a1a', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, flexShrink: 0,
      }}>
        <a href="/dashboard" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#f0f0f0', textDecoration: 'none' }}>
          VIRA
        </a>
        <a href="/dashboard" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>
          ← Dashboard
        </a>
      </div>

      {/* Campaign header */}
      <div style={{ padding: '24px 24px 0', borderBottom: '1px solid #1a1a1a', paddingBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px' }}>
          {campaign?.title}
        </h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555', flexWrap: 'wrap' }}>
          <span>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
          {campaign?.budget_range && <span>💰 {campaign.budget_range}</span>}
          {campaign?.timeline     && <span>📅 {campaign.timeline}</span>}
          <span style={{
            ...{ active: { color: '#4ade80' }, draft: { color: '#d4a847' }, closed: { color: '#555' } }[campaign?.status ?? 'draft'],
            fontWeight: 600, textTransform: 'capitalize',
          }}>
            {campaign?.status}
          </span>
        </div>
      </div>

      {/* Split panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left sidebar — applicant list */}
        <div style={{
          width: 300, flexShrink: 0, borderRight: '1px solid #1a1a1a',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid #1a1a1a' }}>
            {['all', 'pending', 'selected', 'passed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                background: filter === f ? '#f0f0f0' : 'transparent',
                color:      filter === f ? '#0a0a0a' : '#555',
              }}>
                {f}
              </button>
            ))}
          </div>

          {/* Applicant rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#333', fontSize: 13 }}>
              {applicants.length === 0 ? 'No applicants yet' : 'No applicants with this status'}
            </div>
          ) : (
            filtered.map(applicant => {
              const handle = applicant.influencer_profiles?.ig_handle
                ?? applicant.influencer_profiles?.influencers?.profile_name
                ?? 'Unknown'
              const followers = applicant.influencer_profiles?.influencers?.followers_count
              const isActive  = selected?.id === applicant.id

              return (
                <div
                  key={applicant.id}
                  onClick={() => setSelected(applicant)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    borderBottom: '1px solid #111',
                    background: isActive ? '#161616' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#d4a847' : 'transparent'}`,
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: '#f0f0f0' }}>
                        @{handle}
                      </p>
                      <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
                        {fmt(followers ?? null)} followers
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {applicant.ai_fit_score !== null && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(applicant.ai_fit_score) }}>
                          {applicant.ai_fit_score}
                        </span>
                      )}
                      <span style={statusBadge(applicant.status)}>{applicant.status}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right panel — applicant detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#333', fontSize: 14 }}>
              Select an applicant to review their profile
            </div>
          ) : (
            <div style={{ maxWidth: 600 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>
                    @{inf?.ig_handle ?? scr?.profile_name ?? 'Unknown'}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={statusBadge(selected.status)}>{selected.status}</span>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      Applied {new Date(selected.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {selected.status !== 'selected' && (
                    <button onClick={() => updateStatus(selected.id, 'selected')} style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: '#0f2a0f', border: '1px solid #1a3a1a',
                      color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>
                      ✓ Move forward
                    </button>
                  )}
                  {selected.status !== 'passed' && (
                    <button onClick={() => updateStatus(selected.id, 'passed')} style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>
                      Pass
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20,
              }}>
                {[
                  { label: 'Followers',    value: fmt(scr?.followers_count ?? null) },
                  { label: 'Eng. Rate',    value: scr?.engagement_rate ? `${scr.engagement_rate}%` : '—' },
                  { label: 'Avg Likes',    value: fmt(scr?.average_likes ?? null) },
                  { label: 'Avg Comments', value: fmt(scr?.average_comments ?? null) },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#111', border: '1px solid #1e1e1e',
                    borderRadius: 8, padding: '12px 14px',
                  }}>
                    <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                      {s.label}
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* AI fit score */}
              {selected.ai_fit_score !== null && (
                <div style={{
                  background: '#111', border: `1px solid ${scoreColor(selected.ai_fit_score)}22`,
                  borderRadius: 10, padding: '16px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor(selected.ai_fit_score) }}>
                      {selected.ai_fit_score}
                    </span>
                    <div>
                      <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>
                        Campaign fit score
                      </p>
                      <p style={{ fontSize: 13, color: '#ccc', margin: 0 }}>{selected.ai_fit_summary}</p>
                    </div>
                  </div>
                  {selected.match_reasons && selected.match_reasons.length > 0 && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selected.match_reasons.map((r, i) => (
                        <li key={i} style={{ fontSize: 12, color: '#777', display: 'flex', gap: 6 }}>
                          <span style={{ color: '#d4a847' }}>›</span> {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Scraped bio */}
              {scr?.bio && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                    Instagram bio
                  </p>
                  <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6, margin: 0 }}>{scr.bio}</p>
                </div>
              )}

              {/* Self bio */}
              {inf?.short_bio && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                    Self-written bio
                  </p>
                  <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6, margin: 0 }}>{inf.short_bio}</p>
                </div>
              )}

              {/* AI summary */}
              {scr?.ai_summary && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                    AI summary
                  </p>
                  <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6, margin: 0 }}>{scr.ai_summary}</p>
                </div>
              )}

              {/* Niche tags */}
              {inf?.niche_tags && inf.niche_tags.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                    Niches
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {inf.niche_tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20,
                        background: '#1e2a1e', color: '#4ade80', border: '1px solid #2a3a2a',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instagram link */}
              {scr?.instagram_url && (
                <a
                  href={scr.instagram_url}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}
                >
                  View Instagram profile ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}