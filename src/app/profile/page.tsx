'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', accent: '#DDF4FF', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF' }
const NICHE_OPTIONS = ['Food', 'Travel', 'Fashion', 'Lifestyle', 'Fitness', 'Beauty', 'Tech', 'Gaming', 'Parenting', 'Finance']

type ScrapedData = { profile_name: string; bio: string | null; followers_count: number | null; engagement_rate: number | null; average_likes: number | null; instagram_url: string | null }

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [saved, setSaved]       = useState(false)
  const [scraped, setScraped]   = useState<ScrapedData | null>(null)
  const [igHandle, setHandle]   = useState('')
  const [nicheTags, setNiche]   = useState<string[]>([])
  const [bio, setBio]           = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => { if (!data.user) { router.push('/login'); return } })
    fetch('/api/profile/influencer').then(r => r.json()).then(d => {
      if (d.profile) { setHandle(d.profile.ig_handle ?? ''); setNiche(d.profile.niche_tags ?? []); setBio(d.profile.short_bio ?? ''); setLocation(d.profile.audience_location ?? ''); if (d.profile.influencers) setScraped(d.profile.influencers) }
      setLoading(false)
    })
  }, [router])

  const toggleNiche = (tag: string) => setNiche(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null)
    const res = await fetch('/api/profile/influencer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ig_handle: igHandle, niche_tags: nicheTags, short_bio: bio, audience_location: location }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to save'); setSaving(false); return }
    if (data.profile?.influencer_id && !scraped) {
      fetch('/api/profile/influencer').then(r => r.json()).then(d => { if (d.profile?.influencers) setScraped(d.profile.influencers) })
    }
    setSaved(true); setSaving(false); setTimeout(() => setSaved(false), 3000)
  }

  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, color: s.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }
  const label: React.CSSProperties = { fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }

  if (loading) return <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: s.faint, fontFamily: '"DM Sans", sans-serif' }}>Loading…</p></div>

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      <div style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.surface, position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ textDecoration: 'none' }}><span style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: s.primary }}>VIRA</span></a>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13 }}>
          <a href="/campaigns" style={{ color: s.muted, textDecoration: 'none' }}>Campaigns</a>
          <a href="/applications" style={{ color: s.muted, textDecoration: 'none' }}>My applications</a>
          <a href="/profile" style={{ color: s.primary, textDecoration: 'none', fontWeight: 600 }}>Profile</a>
          <button onClick={async () => { await createClient().auth.signOut(); window.location.href = '/login' }} style={{ background: 'transparent', border: `1.5px solid ${s.border}`, borderRadius: 7, padding: '5px 14px', fontSize: 12, color: s.muted, cursor: 'pointer' }}>Log out</button>
        </nav>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Your profile</h1>
        <p style={{ fontSize: 14, color: s.muted, margin: '0 0 28px' }}>This is what marketers see when you apply to a campaign.</p>

        {/* Scraped data match */}
        {scraped && (
          <div style={{ background: '#DCFCE7', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: 700 }}>✦ Matched to scraped Instagram data</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[['Followers', scraped.followers_count?.toLocaleString() ?? '—'], ['Eng. Rate', scraped.engagement_rate ? `${scraped.engagement_rate}%` : '—'], ['Avg Likes', scraped.average_likes?.toLocaleString() ?? '—']].map(([l, v]) => (
                <div key={l}><p style={{ fontSize: 10, color: '#15803D', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</p><p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#14532D' }}>{v}</p></div>
              ))}
            </div>
            {scraped.bio && <p style={{ fontSize: 13, color: '#166534', margin: '10px 0 0', lineHeight: 1.5 }}>{scraped.bio}</p>}
          </div>
        )}

        {!scraped && igHandle && (
          <div style={{ background: '#FEF9C3', border: '1.5px solid #FEF08A', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#854D0E', margin: 0 }}>⚠ No scraped data found for @{igHandle}. Your profile will still be visible — stats will be added once VIRA scrapes your account.</p>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={label}>Instagram handle *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: s.faint, fontSize: 14, pointerEvents: 'none' }}>@</span>
              <input value={igHandle} onChange={e => setHandle(e.target.value.replace(/^@/, ''))} required placeholder="yourhandle" style={{ ...input, paddingLeft: 28 }}
                onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
            </div>
            <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>Enter without @ — we'll match your scraped data automatically</p>
          </div>

          <div>
            <label style={label}>Short bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell brands who you are, what you create, and what makes your audience engaged…"
              style={{ ...input, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
          </div>

          <div>
            <label style={label}>Your niches</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NICHE_OPTIONS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleNiche(tag)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${nicheTags.includes(tag) ? s.primary : s.border}`, background: nicheTags.includes(tag) ? s.accent : 'transparent', color: nicheTags.includes(tag) ? s.primary : s.muted, fontWeight: nicheTags.includes(tag) ? 600 : 400, transition: 'all 0.15s' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={label}>Audience location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Melbourne, Australia" style={input}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
          </div>

          {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: saved ? '#DCFCE7' : saving ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: saved ? '#15803D' : saving ? s.faint : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saved || saving ? 'none' : '0 2px 12px rgba(14,165,233,0.3)', transition: 'all 0.2s' }}>
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save profile'}
            </button>
            <a href="/campaigns" style={{ padding: '12px 20px', borderRadius: 8, border: `1.5px solid ${s.border}`, color: s.muted, fontSize: 14, textDecoration: 'none' }}>Browse campaigns</a>
          </div>
        </form>
      </div>
    </div>
  )
}