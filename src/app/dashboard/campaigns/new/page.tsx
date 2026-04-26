'use client'

// src/app/dashboard/campaigns/new/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NICHE_OPTIONS = ['Food', 'Travel', 'Fashion', 'Lifestyle', 'Fitness', 'Beauty', 'Tech', 'Gaming', 'Parenting', 'Finance']
const CONTENT_OPTIONS = ['Instagram Post', 'Instagram Reel', 'Instagram Story', 'TikTok', 'YouTube', 'Blog']

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [title, setTitle]           = useState('')
  const [description, setDesc]      = useState('')
  const [budget, setBudget]         = useState('')
  const [timeline, setTimeline]     = useState('')
  const [followerMin, setFollMin]   = useState('')
  const [followerMax, setFollMax]   = useState('')
  const [nicheTags, setNiche]       = useState<string[]>([])
  const [contentTags, setContent]   = useState<string[]>([])
  const [publishNow, setPublish]    = useState(false)

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        budget_range:       budget || null,
        timeline:           timeline || null,
        ideal_follower_min: followerMin ? parseInt(followerMin) : null,
        ideal_follower_max: followerMax ? parseInt(followerMax) : null,
        niche_tags:         nicheTags,
        content_type_tags:  contentTags,
        status:             publishNow ? 'active' : 'draft',
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create campaign')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#0a0a0a', border: '1px solid #222',
    borderRadius: 8, padding: '11px 14px',
    fontSize: 14, color: '#f0f0f0', outline: 'none',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#666', display: 'block',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  const tagStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
    border: `1px solid ${active ? '#d4a847' : '#222'}`,
    background: active ? '#1a1500' : 'transparent',
    color: active ? '#d4a847' : '#555',
    transition: 'all 0.15s',
  })

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
        <a href="/dashboard" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#f0f0f0', textDecoration: 'none' }}>
          VIRA
        </a>
        <a href="/dashboard" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>
          ← Back to dashboard
        </a>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 6px' }}>
          Create campaign
        </h1>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 36px' }}>
          This is what influencers will see when browsing campaigns.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Campaign title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="e.g. Melbourne Restaurant Launch — Food Creators"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#444')}
              onBlur={e  => (e.target.style.borderColor = '#222')}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Campaign brief *</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              required
              rows={5}
              placeholder="Describe your brand, campaign goals, content expectations, and ideal creator profile. The more detail you give, the better VIRA's AI can match you with the right influencers."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = '#444')}
              onBlur={e  => (e.target.style.borderColor = '#222')}
            />
            <p style={{ fontSize: 11, color: '#444', margin: '5px 0 0' }}>
              This brief is used by AI to score influencer fit — be specific.
            </p>
          </div>

          {/* Niche tags */}
          <div>
            <label style={labelStyle}>Niche / content type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NICHE_OPTIONS.map(tag => (
                <button key={tag} type="button"
                  onClick={() => toggleTag(tag, nicheTags, setNiche)}
                  style={tagStyle(nicheTags.includes(tag))}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Content format */}
          <div>
            <label style={labelStyle}>Content format</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CONTENT_OPTIONS.map(tag => (
                <button key={tag} type="button"
                  onClick={() => toggleTag(tag, contentTags, setContent)}
                  style={tagStyle(contentTags.includes(tag))}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Budget + Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Budget range</label>
              <input
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. $300–$600"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e  => (e.target.style.borderColor = '#222')}
              />
            </div>
            <div>
              <label style={labelStyle}>Timeline</label>
              <input
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                placeholder="e.g. 3 weeks"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e  => (e.target.style.borderColor = '#222')}
              />
            </div>
          </div>

          {/* Follower range */}
          <div>
            <label style={labelStyle}>Ideal follower range</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <input
                value={followerMin}
                onChange={e => setFollMin(e.target.value)}
                type="number"
                placeholder="Min (e.g. 10000)"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e  => (e.target.style.borderColor = '#222')}
              />
              <input
                value={followerMax}
                onChange={e => setFollMax(e.target.value)}
                type="number"
                placeholder="Max (e.g. 500000)"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e  => (e.target.style.borderColor = '#222')}
              />
            </div>
          </div>

          {/* Publish toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: '#111',
            border: '1px solid #1e1e1e', borderRadius: 8,
          }}>
            <div
              onClick={() => setPublish(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: publishNow ? '#d4a847' : '#222',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3,
                left: publishNow ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', margin: 0 }}>
                {publishNow ? 'Publish immediately' : 'Save as draft'}
              </p>
              <p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>
                {publishNow
                  ? 'Influencers can see and apply to this campaign right away'
                  : 'Only you can see this until you publish it'}
              </p>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                background: loading ? '#1a1a1a' : '#f0f0f0',
                color: loading ? '#444' : '#0a0a0a',
                border: 'none', borderRadius: 8,
                padding: '12px', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Saving…' : publishNow ? 'Publish campaign' : 'Save draft'}
            </button>
            <a
              href="/dashboard"
              style={{
                padding: '12px 20px', borderRadius: 8,
                border: '1px solid #222', color: '#555',
                fontSize: 14, textDecoration: 'none',
                display: 'flex', alignItems: 'center',
              }}
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}