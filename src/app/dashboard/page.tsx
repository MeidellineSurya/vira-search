'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', primaryDark: '#0284C7', accent: '#DDF4FF', bg: '#F8FAFC', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8', surface: '#FFFFFF', shadow: '0 2px 12px rgba(30,41,59,0.08)' }

type Campaign = { id: string; title: string; description: string; status: 'draft' | 'active' | 'closed'; budget_range: string | null; timeline: string | null; niche_tags: string[]; created_at: string }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    active: { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
    draft:  { bg: '#FEF9C3', color: '#854D0E', border: '#FEF08A' },
    closed: { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
  }
  const st = map[status] ?? map.closed
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{status}</span>
}

export default function DashboardPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [email, setEmail]         = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setEmail(data.user.email ?? '')
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role === 'influencer') { router.push('/campaigns'); return }
    })
    fetch('/api/campaigns?mine=true').then(r => r.json()).then(d => { setCampaigns(d.campaigns ?? []); setLoading(false) })
  }, [router])

  const handleLogout = async () => { await createClient().auth.signOut(); router.push('/login') }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/campaigns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: status as Campaign['status'] } : c))
  }

  const counts = { active: campaigns.filter(c => c.status === 'active').length, draft: campaigns.filter(c => c.status === 'draft').length, closed: campaigns.filter(c => c.status === 'closed').length }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: '"DM Sans", sans-serif', color: s.text }}>
      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.surface, position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ textDecoration: 'none' }}><span style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: s.primary }}>VIRA</span></a>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13 }}>
          <a href="/search" style={{ color: s.muted, textDecoration: 'none' }}>Search</a>
          <a href="/campaigns" style={{ color: s.muted, textDecoration: 'none' }}>Campaigns</a>
          <a href="/dashboard" style={{ color: s.primary, textDecoration: 'none', fontWeight: 600 }}>Dashboard</a>
          <button onClick={handleLogout} style={{ background: 'transparent', border: `1.5px solid ${s.border}`, borderRadius: 7, padding: '5px 14px', fontSize: 12, color: s.muted, cursor: 'pointer' }}>Log out</button>
        </nav>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px' }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: s.muted, margin: 0 }}>{email}</p>
          </div>
          <a href="/dashboard/campaigns/new" style={{ padding: '10px 22px', borderRadius: 8, background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 12px rgba(14,165,233,0.3)' }}>
            + New campaign
          </a>
        </div>

        {/* Stats */}
        {campaigns.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[{ label: 'Active', value: counts.active, color: '#15803D', bg: '#DCFCE7' }, { label: 'Draft', value: counts.draft, color: '#854D0E', bg: '#FEF9C3' }, { label: 'Closed', value: counts.closed, color: s.muted, bg: '#F1F5F9' }].map(st => (
              <div key={st.label} style={{ background: st.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${s.border}` }}>
                <p style={{ fontSize: 11, color: st.color, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{st.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: st.color, margin: 0 }}>{st.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Campaign list */}
        {loading ? (
          <p style={{ color: s.faint, fontSize: 14 }}>Loading…</p>
        ) : campaigns.length === 0 ? (
          <div style={{ border: `2px dashed ${s.border}`, borderRadius: 14, padding: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: s.muted, marginBottom: 16 }}>No campaigns yet</p>
            <a href="/dashboard/campaigns/new" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: '#fff', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              + Create your first campaign
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campaigns.map(campaign => (
              <div key={campaign.id} style={{ background: s.surface, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: s.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: s.text }}>{campaign.title}</h2>
                      <StatusBadge status={campaign.status} />
                    </div>
                    {campaign.description && (
                      <p style={{ fontSize: 13, color: s.muted, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {campaign.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: s.muted }}>
                      {campaign.budget_range && <span>💰 {campaign.budget_range}</span>}
                      {campaign.timeline && <span>📅 {campaign.timeline}</span>}
                      {campaign.niche_tags?.length > 0 && <span>{campaign.niche_tags.join(', ')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <a href={`/dashboard/campaigns/${campaign.id}`} style={{ padding: '7px 14px', borderRadius: 8, background: s.accent, border: `1px solid ${s.primaryLight}`, color: s.primaryDark, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      View applicants
                    </a>
                    {campaign.status === 'draft' && (
                      <button onClick={() => updateStatus(campaign.id, 'active')} style={{ padding: '7px 14px', borderRadius: 8, background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#15803D', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Publish</button>
                    )}
                    {campaign.status === 'active' && (
                      <button onClick={() => updateStatus(campaign.id, 'closed')} style={{ padding: '7px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}