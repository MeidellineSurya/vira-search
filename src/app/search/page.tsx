'use client'

// src/app/search/page.tsx
// VIRA Search Page
// Aesthetic: editorial/refined — dark neutral base, warm amber accents, tight typography

import { useState, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Influencer = {
  id: string
  profile_name: string
  bio: string | null
  industry: string | null
  followers_count: number | null
  engagement_rate: number | null
  average_likes: number | null
  average_comments: number | null
  instagram_url: string | null
  ai_summary: string | null
}

type AIState = {
  summary: string | null
  score: number | null
  scoreSummary: string | null
  matchReasons: string[]
  loadingSummary: boolean
  loadingScore: boolean
  error: string | null
}

const emptyAI: AIState = {
  summary: null,
  score: null,
  scoreSummary: null,
  matchReasons: [],
  loadingSummary: false,
  loadingScore: false,
  error: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function igHandle(influencer: Influencer): string {
  return influencer.instagram_url
    ? influencer.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
    : influencer.profile_name
}

// ── Components ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#2a2a2a" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke={scoreColor(score)}
        strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="600" fill={scoreColor(score)}>
        {score}
      </text>
    </svg>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>{value}</span>
    </div>
  )
}

function InfluencerCard({
  influencer,
  campaignDescription,
  isExpanded,
  onExpand,
}: {
  influencer: Influencer
  campaignDescription: string
  isExpanded: boolean
  onExpand: () => void
}) {
  const [ai, setAI] = useState<AIState>(
    influencer.ai_summary
      ? { ...emptyAI, summary: influencer.ai_summary }
      : emptyAI
  )

  const generateSummary = async () => {
    if (ai.summary || ai.loadingSummary) return
    setAI(prev => ({ ...prev, loadingSummary: true, error: null }))
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ influencer_id: influencer.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAI(prev => ({ ...prev, summary: data.summary, loadingSummary: false }))

      // If campaign description exists, auto-generate score after summary
      if (campaignDescription.trim()) {
        generateScore(data.summary)
      }
    } catch (e: unknown) {
      setAI(prev => ({ ...prev, loadingSummary: false, error: (e as Error).message }))
    }
  }

  const generateScore = async (summaryReady?: string) => {
    if (!campaignDescription.trim()) return
    if (!ai.summary && !summaryReady) return   // Need summary first
    if (ai.score !== null || ai.loadingScore) return
    setAI(prev => ({ ...prev, loadingScore: true, error: null }))
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencer_id: influencer.id,
          campaign_description: campaignDescription,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAI(prev => ({
        ...prev,
        score:        data.score,
        scoreSummary: data.summary,
        matchReasons: data.match_reasons ?? [],
        loadingScore: false,
      }))
    } catch (e: unknown) {
      setAI(prev => ({ ...prev, loadingScore: false, error: (e as Error).message }))
    }
  }

  const handle = igHandle(influencer)
  const isLoading = ai.loadingSummary || ai.loadingScore

  return (
    <div
      style={{
        background: isExpanded ? '#1a1a1a' : '#111',
        border: `1px solid ${isExpanded ? '#333' : '#1e1e1e'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: isExpanded ? 'default' : 'pointer',
      }}
      onClick={!isExpanded ? onExpand : undefined}
    >
      {/* Card header */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar placeholder */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `hsl(${influencer.profile_name.charCodeAt(0) * 7 % 360}, 30%, 25%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
          textTransform: 'uppercase',
        }}>
          {influencer.profile_name[0]}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#f0f0f0' }}>
              @{handle}
            </span>
            {influencer.industry && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#1e2a1e', color: '#4ade80', border: '1px solid #2a3a2a',
              }}>
                {influencer.industry}
              </span>
            )}
          </div>
          {influencer.bio && (
            <p style={{
              fontSize: 13, color: '#888', margin: '4px 0 0',
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: isExpanded ? 'normal' : 'nowrap',
              lineHeight: 1.4,
            }}>
              {influencer.bio}
            </p>
          )}
        </div>

        {/* Score ring (shown when score exists) */}
        {ai.score !== null && (
          <div style={{ flexShrink: 0 }}>
            <ScoreRing score={ai.score} />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid #1e1e1e',
        display: 'flex', gap: 24,
      }}>
        <StatPill label="Followers"   value={fmt(influencer.followers_count)} />
        <StatPill label="Eng. Rate"   value={influencer.engagement_rate ? `${influencer.engagement_rate}%` : '—'} />
        <StatPill label="Avg Likes"   value={fmt(influencer.average_likes)} />
        <StatPill label="Avg Comments" value={fmt(influencer.average_comments)} />
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e1e' }}>

          {/* AI Summary */}
          {!ai.summary && !ai.loadingSummary && (
            <button
              onClick={generateSummary}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: 8,
                padding: '8px 16px',
                color: '#d4a847',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#d4a847')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}
            >
              ✦ Generate AI summary
              {campaignDescription.trim() && ' + campaign fit score'}
            </button>
          )}

          {ai.loadingSummary && (
            <p style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>
              Generating summary…
            </p>
          )}

          {ai.summary && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                AI Summary
              </p>
              <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6, margin: 0 }}>
                {ai.summary}
              </p>
            </div>
          )}

          {/* Fit score */}
          {ai.loadingScore && (
            <p style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 8 }}>
              Scoring campaign fit…
            </p>
          )}

          {ai.score !== null && (
            <div style={{
              marginTop: 12, padding: 14,
              background: '#111', borderRadius: 8,
              border: `1px solid ${scoreColor(ai.score)}22`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <ScoreRing score={ai.score} />
                <div>
                  <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    Campaign fit
                  </p>
                  <p style={{ fontSize: 14, color: '#ccc', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {ai.scoreSummary}
                  </p>
                </div>
              </div>
              {ai.matchReasons.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ai.matchReasons.map((r, i) => (
                    <li key={i} style={{ fontSize: 12, color: '#777', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: '#d4a847', marginTop: 1 }}>›</span>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Campaign score trigger (if summary exists but score not yet generated) */}
          {ai.summary && ai.score === null && !ai.loadingScore && campaignDescription.trim() && (
            <button
              onClick={() => generateScore()}
              style={{
                marginTop: 10,
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: 8,
                padding: '7px 14px',
                color: '#d4a847',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Score campaign fit
            </button>
          )}

          {/* Error */}
          {ai.error && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{ai.error}</p>
          )}

          {/* Instagram link */}
          {influencer.instagram_url && (
            <a
              href={influencer.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 14, fontSize: 12, color: '#555',
                textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}
            >
              View on Instagram ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery]                       = useState('')
  const [campaignDescription, setCampaign]      = useState('')
  const [results, setResults]                   = useState<Influencer[]>([])
  const [loading, setLoading]                   = useState(false)
  const [searched, setSearched]                 = useState(false)
  const [expandedId, setExpandedId]             = useState<string | null>(null)
  const [showCampaignInput, setShowCampaignInput] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    setSearched(true)
    setExpandedId(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  const handleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f0f0f0',
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#f0f0f0' }}>
          VIRA
        </span>
        <nav style={{ display: 'flex', gap: 24, fontSize: 13, color: '#555' }}>
          <a href="/search"    style={{ color: '#f0f0f0', textDecoration: 'none' }}>Search</a>
          <a href="/campaigns" style={{ color: '#555',   textDecoration: 'none' }}>Campaigns</a>
          <a href="/dashboard" style={{ color: '#555',   textDecoration: 'none' }}>Dashboard</a>
        </nav>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em',
            color: '#f0f0f0', margin: '0 0 8px',
          }}>
            Find influencers
          </h1>
          <p style={{ fontSize: 15, color: '#555', margin: 0 }}>
            Search 118 Melbourne food & lifestyle creators. No account needed.
          </p>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: '#444', fontSize: 16, pointerEvents: 'none',
          }}>
            ⌕
          </span>
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search by name, niche, or keyword…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111', border: '1px solid #222',
              borderRadius: 10, padding: '13px 16px 13px 42px',
              fontSize: 15, color: '#f0f0f0',
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#333')}
            onBlur={e  => (e.target.style.borderColor = '#222')}
            onKeyDown={e => e.key === 'Enter' && search(query)}
          />
        </div>

        {/* Campaign description toggle */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => setShowCampaignInput(v => !v)}
            style={{
              background: 'transparent', border: 'none',
              color: showCampaignInput ? '#d4a847' : '#444',
              fontSize: 13, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 10 }}>{showCampaignInput ? '▼' : '▶'}</span>
            {showCampaignInput ? 'Hide campaign description' : '+ Add campaign description for AI fit scoring'}
          </button>

          {showCampaignInput && (
            <div style={{ marginTop: 10 }}>
              <textarea
                value={campaignDescription}
                onChange={e => setCampaign(e.target.value)}
                placeholder="Describe your campaign — product, goal, tone, target audience. The more detail, the better the fit scores."
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#111', border: '1px solid #222',
                  borderRadius: 10, padding: '12px 16px',
                  fontSize: 13, color: '#ccc',
                  resize: 'vertical', outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: 'inherit', lineHeight: 1.5,
                }}
                onFocus={e => (e.target.style.borderColor = '#d4a847')}
                onBlur={e  => (e.target.style.borderColor = '#222')}
              />
              {campaignDescription.trim() && (
                <p style={{ fontSize: 11, color: '#444', margin: '6px 0 0' }}>
                  ✦ Open any influencer card and click "Generate AI summary" to see fit score
                </p>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#444', fontSize: 14 }}>
            Searching…
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
            <p style={{ fontSize: 15, marginBottom: 8 }}>No influencers found for "{query}"</p>
            <p style={{ fontSize: 13, color: '#333' }}>Try a broader search term</p>
          </div>
        )}

        {!loading && !searched && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#333', fontSize: 14 }}>
            Type to search, or press Enter to browse all
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p style={{ fontSize: 12, color: '#444', marginBottom: 16 }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
              {query ? ` for "${query}"` : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map(inf => (
                <InfluencerCard
                  key={inf.id}
                  influencer={inf}
                  campaignDescription={campaignDescription}
                  isExpanded={expandedId === inf.id}
                  onExpand={() => handleExpand(inf.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}