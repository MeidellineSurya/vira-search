'use client'

// src/app/profile/page.tsx
// Influencer profile creation + edit page

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NICHE_OPTIONS = ['Food', 'Travel', 'Fashion', 'Lifestyle', 'Fitness', 'Beauty', 'Tech', 'Gaming', 'Parenting', 'Finance']

type ScrapedData = {
  profile_name: string
  bio: string | null
  followers_count: number | null
  engagement_rate: number | null
  average_likes: number | null
  instagram_url: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [saved, setSaved]           = useState(false)
  const [scraped, setScraped]       = useState<ScrapedData | null>(null)

  const [igHandle, setHandle]       = useState('')
  const [nicheTags, setNiche]       = useState<string[]>([])
  const [bio, setBio]               = useState('')
  const [location, setLocation]     = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
    })

    fetch('/api/profile/influencer').then(r => r.json()).then(d => {
      if (d.profile) {
        setHandle(d.profile.ig_handle ?? '')
        setNiche(d.profile.niche_tags ?? [])
        setBio(d.profile.short_bio ?? '')
        setLocation(d.profile.audience_location ?? '')
        if (d.profile.influencers) setScraped(d.profile.influencers)
      }
      setLoading(false)
    })
  }, [router])

  const toggleNiche = (tag: string) => {
    setNiche(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/profile/influencer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ig_handle:        igHandle,
        niche_tags:       nicheTags,
        short_bio:        bio,
        audience_location: location,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to save profile')
      setSaving(false)
      return
    }

    // Check if scraped data matched
    if (data.profile?.influencer_id && !scraped) {
      fetch('/api/profile/influencer').then(r => r.json()).then(d => {
        if (d.profile?.influencers) setScraped(d.profile.influencers)
      })
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#0a0a0a', border: '1px solid #222',
    borderRadius: 8, padding: '11px 14px',
    fontSize: 14, color: '#f0f0f0', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#666', display: 'block',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#444', fontFamily: '"DM Sans", sans-serif' }}>Loading…</p>
    </div>
  )

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
            <a href="/campaigns"    style={{ color: '#555', textDecoration: 'none' }}>Campaigns</a>
            <a href="/applications" style={{ color: '#555', textDecoration: 'none' }}>My applications</a>
            <a href="/profile"      style={{ color: '#f0f0f0', textDecoration: 'none' }}>Profile</a>
            <button onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); window.location.href = '/login' }} style={{ background: 'transparent', border: '1px solid #222', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#555', cursor: 'pointer' }}>
                Log out
            </button>
        </nav>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 6px' }}>
          Your profile
        </h1>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 32px' }}>
          This is what marketers see when you apply to a campaign.
        </p>

        {/* Scraped data preview */}
        {scraped && (
          <div style={{
            background: '#111', border: '1px solid #1e2a1e',
            borderRadius: 10, padding: '16px 20px', marginBottom: 28,
          }}>
            <p style={{ fontSize: 11, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: 600 }}>
              ✦ Matched to scraped Instagram data
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 10, color: '#555', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Followers</p>
                <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {scraped.followers_count?.toLocaleString() ?? '—'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: '#555', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Eng. Rate</p>
                <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {scraped.engagement_rate ? `${scraped.engagement_rate}%` : '—'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: '#555', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Likes</p>
                <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {scraped.average_likes?.toLocaleString() ?? '—'}
                </p>
              </div>
            </div>
            {scraped.bio && (
              <p style={{ fontSize: 13, color: '#666', margin: '10px 0 0', lineHeight: 1.5 }}>
                {scraped.bio}
              </p>
            )}
          </div>
        )}

        {!scraped && igHandle && (
          <div style={{
            background: '#1a1a0a', border: '1px solid #2a2a0f',
            borderRadius: 10, padding: '14px 18px', marginBottom: 28,
          }}>
            <p style={{ fontSize: 13, color: '#d4a847', margin: 0 }}>
              ⚠ No scraped data found for @{igHandle}. Your profile will still be visible to marketers — stats will show once your data is added to VIRA.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Instagram handle */}
          <div>
            <label style={labelStyle}>Instagram handle *</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#444', fontSize: 14, pointerEvents: 'none',
              }}>@</span>
              <input
                value={igHandle}
                onChange={e => setHandle(e.target.value.replace(/^@/, ''))}
                required
                placeholder="yourhandle"
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e  => (e.target.style.borderColor = '#222')}
              />
            </div>
            <p style={{ fontSize: 11, color: '#444', margin: '5px 0 0' }}>
              Enter without @ — we'll try to match your scraped data automatically
            </p>
          </div>

          {/* Short bio */}
          <div>
            <label style={labelStyle}>Short bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder="Tell brands who you are, what you create, and what makes your audience engaged…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = '#444')}
              onBlur={e  => (e.target.style.borderColor = '#222')}
            />
          </div>

          {/* Niche tags */}
          <div>
            <label style={labelStyle}>Your niches</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NICHE_OPTIONS.map(tag => (
                <button
                  key={tag} type="button"
                  onClick={() => toggleNiche(tag)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: `1px solid ${nicheTags.includes(tag) ? '#d4a847' : '#222'}`,
                    background: nicheTags.includes(tag) ? '#1a1500' : 'transparent',
                    color: nicheTags.includes(tag) ? '#d4a847' : '#555',
                    transition: 'all 0.15s',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Audience location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Melbourne, Australia"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#444')}
              onBlur={e  => (e.target.style.borderColor = '#222')}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                background: saved ? '#0f2a0f' : saving ? '#1a1a1a' : '#f0f0f0',
                color:      saved ? '#4ade80'  : saving ? '#444'    : '#0a0a0a',
                border:     saved ? '1px solid #1a3a1a' : 'none',
                borderRadius: 8, padding: '12px',
                fontSize: 14, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save profile'}
            </button>
            <a href="/campaigns" style={{
              padding: '12px 20px', borderRadius: 8,
              border: '1px solid #222', color: '#555',
              fontSize: 14, textDecoration: 'none',
            }}>
              Browse campaigns
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}