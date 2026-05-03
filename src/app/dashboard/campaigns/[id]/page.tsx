'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', primaryDark: '#0284C7', accent: '#DDF4FF', bg: '#F8FAFC', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)' }

type Influencer = { id: string; profile_name: string; bio: string | null; followers_count: number | null; engagement_rate: number | null; average_likes: number | null; average_comments: number | null; instagram_url: string | null; ai_summary: string | null }
type InfluencerProfile = { id: string; ig_handle: string | null; niche_tags: string[] | null; short_bio: string | null; influencers: Influencer | null }
type Applicant = { id: string; status: 'pending' | 'viewed' | 'selected' | 'passed'; applied_at: string; ai_fit_score: number | null; ai_fit_summary: string | null; match_reasons: string[] | null; contact_email: string | null; influencer_profiles: InfluencerProfile | null }
type Campaign = { id: string; title: string; description: string; notes: string | null; status: string; budget_range: string | null; timeline: string | null }

function fmt(n: number | null) { if (n == null) return '—'; if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'; if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'; return n.toString() }
function scoreColor(score: number) { return score >= 75 ? '#15803D' : score >= 50 ? '#854D0E' : '#DC2626' }
function scoreBg(score: number)    { return score >= 75 ? '#DCFCE7' : score >= 50 ? '#FEF9C3' : '#FEF2F2' }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    pending:  { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
    viewed:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    selected: { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
    passed:   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  }
  const st = map[status] ?? map.pending
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{status}</span>
}

function ScoreRing({ score }: { score: number }) {
  const r = 20, circ = 2 * Math.PI * r, fill = (score / 100) * circ
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#E2E8F0" strokeWidth="4" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={scoreColor(score)} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill={scoreColor(score)}>{score}</text>
    </svg>
  )
}

export default function CampaignDetailPage() {
  const params = useParams(); const router = useRouter(); const id = params.id as string
  const [campaign, setCampaign]     = useState<Campaign | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [selected, setSelected]     = useState<Applicant | null>(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${id}`).then(r => r.json()),
      fetch(`/api/campaigns/${id}/applicants`).then(r => r.json()),
    ]).then(([cData, aData]) => {
      if (cData.error) { router.push('/dashboard'); return }
      setCampaign(cData.campaign); setApplicants(aData.applicants ?? []); setLoading(false)
    })
  }, [id, router])

  const updateStatus = async (applicantId: string, status: string) => {
    await fetch(`/api/campaigns/${id}/applicants`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ application_id: applicantId, status }) })
    setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status: status as Applicant['status'] } : a))
    if (selected?.id === applicantId) setSelected(prev => prev ? { ...prev, status: status as Applicant['status'] } : null)
  }

  const filtered = filter === 'all' ? applicants : applicants.filter(a => a.status === filter)
  const inf = selected?.influencer_profiles
  const scr = inf?.influencers

  if (loading) return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif' }}>
      <Nav active="dashboard" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: s.faint }}>Loading…</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif', color: s.text, display: 'flex', flexDirection: 'column' }}>
      <Nav active="dashboard" />

      {/* Campaign header */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${s.border}`, background: s.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <a href="/dashboard" style={{ fontSize: 12, color: s.muted, textDecoration: 'none' }}>← Dashboard</a>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>{campaign?.title}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: s.muted, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: campaign?.status === 'active' ? '#15803D' : s.muted, textTransform: 'capitalize' }}>{campaign?.status}</span>
          <span>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
          {campaign?.budget_range && <span>💰 {campaign.budget_range}</span>}
          {campaign?.timeline && <span>📅 {campaign.timeline}</span>}
        </div>
        {campaign?.notes && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#FEF9C3', border: '1px solid #FEF08A', borderRadius: 8, fontSize: 12, color: '#854D0E' }}>
            🔒 <strong>Internal notes:</strong> {campaign.notes}
          </div>
        )}
      </div>

      {/* Split panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${s.border}`, overflowY: 'auto', background: s.surface, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 4, padding: '10px 12px', borderBottom: `1px solid ${s.border}` }}>
            {['all', 'pending', 'selected', 'passed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: filter === f ? s.primary : 'transparent', color: filter === f ? '#fff' : s.muted, transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: s.faint, fontSize: 13 }}>
              {applicants.length === 0 ? 'No applicants yet' : 'No applicants with this status'}
            </div>
          ) : filtered.map(applicant => {
            const handle = applicant.influencer_profiles?.ig_handle ?? applicant.influencer_profiles?.influencers?.profile_name ?? 'Unknown'
            const followers = applicant.influencer_profiles?.influencers?.followers_count
            const isActive = selected?.id === applicant.id
            return (
              <div key={applicant.id} onClick={() => setSelected(applicant)} style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: `1px solid ${s.border}`, background: isActive ? s.accent : 'transparent', borderLeft: `3px solid ${isActive ? s.primary : 'transparent'}`, transition: 'all 0.1s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: s.text }}>@{handle}</p>
                    <p style={{ fontSize: 11, color: s.faint, margin: 0 }}>{fmt(followers ?? null)} followers</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {applicant.ai_fit_score !== null && <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(applicant.ai_fit_score) }}>{applicant.ai_fit_score}</span>}
                    <StatusBadge status={applicant.status} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: s.bg }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: s.faint, fontSize: 14 }}>
              Select an applicant to review their profile
            </div>
          ) : (
            <div style={{ maxWidth: 600 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>@{inf?.ig_handle ?? scr?.profile_name ?? 'Unknown'}</h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={selected.status} />
                    <span style={{ fontSize: 12, color: s.faint }}>Applied {new Date(selected.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selected.status !== 'selected' && (
                    <button onClick={() => updateStatus(selected.id, 'selected')} style={{ padding: '8px 16px', borderRadius: 8, background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#15803D', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Move forward</button>
                  )}
                  {selected.status !== 'passed' && (
                    <button onClick={() => updateStatus(selected.id, 'passed')} style={{ padding: '8px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Pass</button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[['Followers', fmt(scr?.followers_count ?? null)], ['Eng. Rate', scr?.engagement_rate ? `${scr.engagement_rate}%` : '—'], ['Avg Likes', fmt(scr?.average_likes ?? null)], ['Avg Comments', fmt(scr?.average_comments ?? null)]].map(([label, value]) => (
                  <div key={label} style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 10, padding: '12px 14px', boxShadow: s.shadow }}>
                    <p style={{ fontSize: 10, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: s.text, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Fit score */}
              {selected.ai_fit_score !== null && (
                <div style={{ marginBottom: 16, padding: 16, background: scoreBg(selected.ai_fit_score), borderRadius: 12, border: `1.5px solid ${scoreColor(selected.ai_fit_score)}44` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <ScoreRing score={selected.ai_fit_score} />
                    <div>
                      <p style={{ fontSize: 11, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Campaign fit score</p>
                      <p style={{ fontSize: 14, color: s.text, margin: 0, lineHeight: 1.5 }}>{selected.ai_fit_summary}</p>
                    </div>
                  </div>
                  {selected.match_reasons && selected.match_reasons.length > 0 && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selected.match_reasons.map((r, i) => <li key={i} style={{ fontSize: 12, color: s.muted, display: 'flex', gap: 6 }}><span style={{ color: s.primary }}>›</span>{r}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {scr?.bio && <div style={{ marginBottom: 14 }}><p style={{ fontSize: 11, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Instagram bio</p><p style={{ fontSize: 14, color: s.text, lineHeight: 1.65, margin: 0 }}>{scr.bio}</p></div>}
              {inf?.short_bio && <div style={{ marginBottom: 14 }}><p style={{ fontSize: 11, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Self-written bio</p><p style={{ fontSize: 14, color: s.text, lineHeight: 1.65, margin: 0 }}>{inf.short_bio}</p></div>}
              {scr?.ai_summary && <div style={{ marginBottom: 14 }}><p style={{ fontSize: 11, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>AI summary</p><p style={{ fontSize: 14, color: s.text, lineHeight: 1.65, margin: 0 }}>{scr.ai_summary}</p></div>}

              {inf?.niche_tags && inf.niche_tags.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Niches</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {inf.niche_tags.map(tag => <span key={tag} style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20, background: s.accent, color: s.primaryDark, fontWeight: 600 }}>{tag}</span>)}
                  </div>
                </div>
              )}

              {scr?.instagram_url && <a href={scr.instagram_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: s.primary, textDecoration: 'none', fontWeight: 600 }}>View Instagram profile ↗</a>}

              {/* Contact email */}
              {selected.contact_email && (
                <div style={{ marginTop: 16, padding: '14px 16px', background: s.accent, border: `1.5px solid ${s.primaryLight}`, borderRadius: 10 }}>
                  <p style={{ fontSize: 11, color: s.primaryDark, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 700 }}>Contact email</p>
                  <a href={`mailto:${selected.contact_email}`} style={{ fontSize: 14, color: s.primary, textDecoration: 'none', fontWeight: 600 }}>
                    {selected.contact_email}
                  </a>
                  <p style={{ fontSize: 11, color: s.muted, margin: '4px 0 0' }}>Click to open in your email client</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}