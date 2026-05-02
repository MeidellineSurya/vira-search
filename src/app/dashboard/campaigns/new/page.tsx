'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', accent: '#DDF4FF', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF' }
const NICHE_OPTIONS   = ['Food', 'Travel', 'Fashion', 'Lifestyle', 'Fitness', 'Beauty', 'Tech', 'Gaming', 'Parenting', 'Finance']
const CONTENT_OPTIONS = ['Instagram Post', 'Instagram Reel', 'Instagram Story', 'TikTok', 'YouTube', 'Blog']

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [title, setTitle]         = useState('')
  const [description, setDesc]    = useState('')
  const [budget, setBudget]       = useState('')
  const [timeline, setTimeline]   = useState('')
  const [followerMin, setFollMin] = useState('')
  const [followerMax, setFollMax] = useState('')
  const [nicheTags, setNiche]     = useState<string[]>([])
  const [contentTags, setContent] = useState<string[]>([])
  const [publishNow, setPublish]  = useState(false)

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const res = await fetch('/api/campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, budget_range: budget || null, timeline: timeline || null, ideal_follower_min: followerMin ? parseInt(followerMin) : null, ideal_follower_max: followerMax ? parseInt(followerMax) : null, niche_tags: nicheTags, content_type_tags: contentTags, status: publishNow ? 'active' : 'draft' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create campaign'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, color: s.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }
  const label: React.CSSProperties = { fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const tagStyle = (active: boolean): React.CSSProperties => ({ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${active ? s.primary : s.border}`, background: active ? s.accent : 'transparent', color: active ? s.primary : s.muted, fontWeight: active ? 600 : 400, transition: 'all 0.15s', fontFamily: 'inherit' })

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <Nav active="dashboard" />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <a href="/dashboard" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← Dashboard</a>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Create campaign</h1>
        <p style={{ fontSize: 14, color: s.muted, margin: '0 0 36px' }}>This is what influencers will see when browsing campaigns.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <label style={label}>Campaign title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Melbourne Restaurant Launch — Food Creators" style={input}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
          </div>

          <div>
            <label style={label}>Campaign brief *</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} required rows={5}
              placeholder="Describe your brand, campaign goals, content expectations, and ideal creator profile. The more detail, the better VIRA's AI can match you."
              style={{ ...input, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
            <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>This brief is used by AI to score influencer fit — be specific.</p>
          </div>

          <div>
            <label style={label}>Niche</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NICHE_OPTIONS.map(tag => <button key={tag} type="button" onClick={() => toggleTag(tag, nicheTags, setNiche)} style={tagStyle(nicheTags.includes(tag))}>{tag}</button>)}
            </div>
          </div>

          <div>
            <label style={label}>Content format</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CONTENT_OPTIONS.map(tag => <button key={tag} type="button" onClick={() => toggleTag(tag, contentTags, setContent)} style={tagStyle(contentTags.includes(tag))}>{tag}</button>)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={label}>Budget range</label>
              <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $300–$600" style={input}
                onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
            </div>
            <div>
              <label style={label}>Time</label>
              <input value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="e.g. 3 weeks" style={input}
                onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
            </div>
          </div>

          <div>
            <label style={label}>Ideal follower range</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <input value={followerMin} onChange={e => setFollMin(e.target.value)} type="number" placeholder="Min (e.g. 10000)" style={input}
                onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
              <input value={followerMax} onChange={e => setFollMax(e.target.value)} type="number" placeholder="Max (e.g. 500000)" style={input}
                onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: publishNow ? s.accent : '#F8FAFC', border: `1.5px solid ${publishNow ? s.primary : s.border}`, borderRadius: 10, transition: 'all 0.2s' }}>
            <div onClick={() => setPublish(v => !v)} style={{ width: 40, height: 22, borderRadius: 11, background: publishNow ? s.primary : s.border, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: publishNow ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: s.text, margin: 0 }}>{publishNow ? 'Publish immediately' : 'Save as draft'}</p>
              <p style={{ fontSize: 12, color: s.muted, margin: '2px 0 0' }}>{publishNow ? 'Influencers can see and apply right away' : 'Only you can see this until you publish'}</p>
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: loading ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: loading ? s.faint : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 12px rgba(14,165,233,0.3)', fontFamily: 'inherit' }}>
              {loading ? 'Saving…' : publishNow ? 'Publish campaign' : 'Save draft'}
            </button>
            <a href="/dashboard" style={{ padding: '12px 20px', borderRadius: 8, border: `1.5px solid ${s.border}`, color: s.muted, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}