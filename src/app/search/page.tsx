'use client'

import { useState, useCallback, useRef } from 'react'
import Nav from '@/components/Nav'

const s = {
  primary: '#0EA5E9', primaryLight: '#38BDF8', primaryDark: '#0284C7',
  accent: '#DDF4FF', bg: '#F8FAFC', border: '#E2E8F0',
  text: '#1E293B', muted: '#64748B', faint: '#94A3B8',
  surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)',
}

type Influencer = {
  id: string; profile_name: string; bio: string | null; industry: string | null
  followers_count: number | null; engagement_rate: number | null
  average_likes: number | null; average_comments: number | null
  instagram_url: string | null; ai_summary: string | null
}

type AIState = {
  summary: string | null; score: number | null; scoreSummary: string | null
  matchReasons: string[]; loadingSummary: boolean; loadingScore: boolean; error: string | null
}

const emptyAI: AIState = { summary: null, score: null, scoreSummary: null, matchReasons: [], loadingSummary: false, loadingScore: false, error: null }

function fmt(n: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function scoreColor(score: number) { return score >= 75 ? '#15803D' : score >= 50 ? '#854D0E' : '#DC2626' }
function scoreBg(score: number)    { return score >= 75 ? '#DCFCE7' : score >= 50 ? '#FEF9C3' : '#FEF2F2' }

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

function InfluencerCard({ influencer, campaignDescription, isExpanded, onExpand }: {
  influencer: Influencer; campaignDescription: string; isExpanded: boolean; onExpand: () => void
}) {
  const [ai, setAI] = useState<AIState>(influencer.ai_summary ? { ...emptyAI, summary: influencer.ai_summary } : emptyAI)

  const generateSummary = async () => {
    if (ai.summary || ai.loadingSummary) return
    setAI(p => ({ ...p, loadingSummary: true, error: null }))
    try {
      const res = await fetch('/api/ai/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ influencer_id: influencer.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAI(p => ({ ...p, summary: data.summary, loadingSummary: false }))
      if (campaignDescription.trim()) generateScore(data.summary)
    } catch (e: unknown) { setAI(p => ({ ...p, loadingSummary: false, error: (e as Error).message })) }
  }

  const generateScore = async (summaryReady?: string) => {
    if (!campaignDescription.trim() || (!ai.summary && !summaryReady) || ai.score !== null || ai.loadingScore) return
    setAI(p => ({ ...p, loadingScore: true, error: null }))
    try {
      const res = await fetch('/api/ai/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ influencer_id: influencer.id, campaign_description: campaignDescription }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAI(p => ({ ...p, score: data.score, scoreSummary: data.summary, matchReasons: data.match_reasons ?? [], loadingScore: false }))
    } catch (e: unknown) { setAI(p => ({ ...p, loadingScore: false, error: (e as Error).message })) }
  }

  const handle = influencer.instagram_url
    ? influencer.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
    : influencer.profile_name

  return (
    <div onClick={!isExpanded ? onExpand : undefined} style={{
      background: s.surface, border: `1.5px solid ${isExpanded ? s.primary : s.border}`,
      borderRadius: 12, overflow: 'hidden', cursor: isExpanded ? 'default' : 'pointer',
      boxShadow: isExpanded ? '0 4px 20px rgba(14,165,233,0.1)' : s.shadow,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
          {influencer.profile_name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: s.text }}>@{handle}</span>
            {influencer.industry && <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: s.accent, color: s.primaryDark, fontWeight: 600 }}>{influencer.industry}</span>}
          </div>
          {influencer.bio && <p style={{ fontSize: 13, color: s.muted, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap', lineHeight: 1.4 }}>{influencer.bio}</p>}
        </div>
        {ai.score !== null && <div style={{ flexShrink: 0 }}><ScoreRing score={ai.score} /></div>}
      </div>

      <div style={{ padding: '10px 20px', borderTop: `1px solid ${s.border}`, display: 'flex', gap: 24, background: '#F8FAFC' }}>
        {[['Followers', fmt(influencer.followers_count)], ['Eng. Rate', influencer.engagement_rate ? `${influencer.engagement_rate}%` : '—'], ['Avg Likes', fmt(influencer.average_likes)], ['Avg Comments', fmt(influencer.average_comments)]].map(([label, value]) => (
          <div key={label}>
            <p style={{ fontSize: 10, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>{label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: s.text, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {isExpanded && (
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${s.border}` }}>
          {!ai.summary && !ai.loadingSummary && (
            <button onClick={generateSummary} style={{ background: s.accent, border: `1.5px solid ${s.primaryLight}`, borderRadius: 8, padding: '9px 18px', color: s.primaryDark, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ✦ Generate AI summary{campaignDescription.trim() ? ' + campaign fit score' : ''}
            </button>
          )}
          {ai.loadingSummary && <p style={{ fontSize: 13, color: s.muted, fontStyle: 'italic' }}>Generating summary…</p>}
          {ai.summary && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>AI Summary</p>
              <p style={{ fontSize: 14, color: s.text, lineHeight: 1.65, margin: 0 }}>{ai.summary}</p>
            </div>
          )}
          {ai.loadingScore && <p style={{ fontSize: 13, color: s.muted, fontStyle: 'italic', marginTop: 8 }}>Scoring campaign fit…</p>}
          {ai.score !== null && (
            <div style={{ marginTop: 12, padding: 14, background: scoreBg(ai.score), borderRadius: 10, border: `1.5px solid ${scoreColor(ai.score)}33` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <ScoreRing score={ai.score} />
                <div>
                  <p style={{ fontSize: 11, color: s.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Campaign fit</p>
                  <p style={{ fontSize: 14, color: s.text, margin: 0, lineHeight: 1.4 }}>{ai.scoreSummary}</p>
                </div>
              </div>
              {ai.matchReasons.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ai.matchReasons.map((r, i) => <li key={i} style={{ fontSize: 12, color: s.muted, display: 'flex', gap: 6 }}><span style={{ color: s.primary }}>›</span>{r}</li>)}
                </ul>
              )}
            </div>
          )}
          {ai.summary && ai.score === null && !ai.loadingScore && campaignDescription.trim() && (
            <button onClick={() => generateScore()} style={{ marginTop: 10, background: s.accent, border: `1.5px solid ${s.primaryLight}`, borderRadius: 8, padding: '7px 14px', color: s.primaryDark, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Score campaign fit
            </button>
          )}
          {ai.error && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 8 }}>{ai.error}</p>}
          {influencer.instagram_url && (
            <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 14, fontSize: 12, color: s.primary, textDecoration: 'none', fontWeight: 600 }}>
              View on Instagram ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const [query, setQuery]                         = useState('')
  const [campaignDescription, setCampaign]        = useState('')
  const [results, setResults]                     = useState<Influencer[]>([])
  const [loading, setLoading]                     = useState(false)
  const [searched, setSearched]                   = useState(false)
  const [expandedId, setExpandedId]               = useState<string | null>(null)
  const [showCampaignInput, setShowCampaignInput] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    setLoading(true); setSearched(true); setExpandedId(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`)
      setResults((await res.json()).results ?? [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <Nav active="search" />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '0 0 8px' }}>Find influencers</h1>
          <p style={{ fontSize: 14, color: s.muted, margin: 0 }}>Search 118 Melbourne food & lifestyle creators. No account needed.</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: s.faint, fontSize: 18, pointerEvents: 'none' }}>⌕</span>
          <input value={query} onChange={e => handleQueryChange(e.target.value)} placeholder="Search by name, niche, or keyword…"
            style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 10, padding: '13px 16px 13px 44px', fontSize: 15, color: s.text, outline: 'none', boxShadow: s.shadow, fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)}
            onKeyDown={e => e.key === 'Enter' && search(query)} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <button onClick={() => setShowCampaignInput(v => !v)} style={{ background: 'transparent', border: 'none', color: showCampaignInput ? s.primary : s.faint, fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontFamily: 'inherit' }}>
            <span style={{ fontSize: 10 }}>{showCampaignInput ? '▼' : '▶'}</span>
            {showCampaignInput ? 'Hide campaign description' : '+ Add campaign description for AI fit scoring'}
          </button>
          {showCampaignInput && (
            <div style={{ marginTop: 10 }}>
              <textarea value={campaignDescription} onChange={e => setCampaign(e.target.value)}
                placeholder="Describe your campaign — product, goal, tone, target audience." rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: s.text, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
              {campaignDescription.trim() && <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>✦ Open any influencer card and click "Generate AI summary" to see fit score</p>}
            </div>
          )}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '48px 0', color: s.faint, fontSize: 14 }}>Searching…</div>}
        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 15, color: s.muted, marginBottom: 8 }}>No influencers found for "{query}"</p>
            <p style={{ fontSize: 13, color: s.faint }}>Try a broader search term</p>
          </div>
        )}
        {!loading && !searched && <div style={{ textAlign: 'center', padding: '48px 0', color: s.faint, fontSize: 14 }}>Type to search, or press Enter to browse all</div>}
        {!loading && results.length > 0 && (
          <>
            <p style={{ fontSize: 12, color: s.faint, marginBottom: 16 }}>{results.length} result{results.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(inf => (
                <InfluencerCard key={inf.id} influencer={inf} campaignDescription={campaignDescription}
                  isExpanded={expandedId === inf.id} onExpand={() => setExpandedId(prev => prev === inf.id ? null : inf.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}