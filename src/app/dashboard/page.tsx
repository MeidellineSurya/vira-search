// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Campaign = {
  id: string
  title: string
  description: string
  status: 'draft' | 'active' | 'closed'
  budget_range: string | null
  timeline: string | null
  niche_tags: string[]
  created_at: string
}

function statusStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    active: { background: '#0f2a0f', color: '#4ade80', border: '1px solid #1a3a1a' },
    draft:  { background: '#1a1a0a', color: '#d4a847', border: '1px solid #2a2a0f' },
    closed: { background: '#1a1a1a', color: '#555',    border: '1px solid #222' },
  }
  return { ...map[status], fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }
}

export default function DashboardPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [email, setEmail]         = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setEmail(data.user.email ?? '')
    })

    fetch('/api/campaigns?mine=true')
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns ?? []); setLoading(false) })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: status as Campaign['status'] } : c))
  }

  const counts = {
    active: campaigns.filter(c => c.status === 'active').length,
    draft:  campaigns.filter(c => c.status === 'draft').length,
    closed: campaigns.filter(c => c.status === 'closed').length,
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
          <a href="/campaigns" style={{ color: '#555', textDecoration: 'none' }}>Campaigns</a>
          <a href="/dashboard" style={{ color: '#f0f0f0', textDecoration: 'none' }}>Dashboard</a>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid #222',
            borderRadius: 6, padding: '5px 12px',
            fontSize: 12, color: '#555', cursor: 'pointer',
          }}>
            Log out
          </button>
        </nav>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 4px' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{email}</p>
          </div>
          <a
            href="/dashboard/campaigns/new"
            style={{
              background: '#f0f0f0', color: '#0a0a0a',
              padding: '10px 20px', borderRadius: 8,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}
          >
            + New campaign
          </a>
        </div>

        {/* Stats */}
        {campaigns.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Active', value: counts.active, color: '#4ade80' },
              { label: 'Draft',  value: counts.draft,  color: '#d4a847' },
              { label: 'Closed', value: counts.closed, color: '#555'    },
            ].map(s => (
              <div key={s.label} style={{
                background: '#111', border: '1px solid #1e1e1e',
                borderRadius: 10, padding: '16px 20px',
              }}>
                <p style={{ fontSize: 11, color: '#555', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Campaign list */}
        {loading ? (
          <p style={{ color: '#444', fontSize: 14 }}>Loading…</p>
        ) : campaigns.length === 0 ? (
          <div style={{
            border: '1px dashed #222', borderRadius: 12,
            padding: '64px', textAlign: 'center', color: '#333',
          }}>
            <p style={{ fontSize: 15, marginBottom: 16 }}>No campaigns yet</p>
            <a
              href="/dashboard/campaigns/new"
              style={{
                display: 'inline-block',
                background: '#f0f0f0', color: '#0a0a0a',
                padding: '10px 20px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              + Create your first campaign
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campaigns.map(campaign => (
              <div key={campaign.id} style={{
                background: '#111', border: '1px solid #1e1e1e',
                borderRadius: 12, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f0f0f0' }}>
                        {campaign.title}
                      </h2>
                      <span style={statusStyle(campaign.status)}>{campaign.status}</span>
                    </div>
                    {campaign.description && (
                      <p style={{
                        fontSize: 13, color: '#666', margin: '0 0 10px',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {campaign.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {campaign.budget_range && (
                        <span style={{ fontSize: 12, color: '#555' }}>💰 {campaign.budget_range}</span>
                      )}
                      {campaign.timeline && (
                        <span style={{ fontSize: 12, color: '#555' }}>📅 {campaign.timeline}</span>
                      )}
                      {campaign.niche_tags?.length > 0 && (
                        <span style={{ fontSize: 12, color: '#555' }}>{campaign.niche_tags.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <a
                      href={`/dashboard/campaigns/${campaign.id}`}
                      style={{
                        padding: '7px 14px', borderRadius: 7,
                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                        color: '#f0f0f0', fontSize: 12, fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      View applicants
                    </a>
                    {campaign.status === 'draft' && (
                      <button onClick={() => updateStatus(campaign.id, 'active')} style={{
                        padding: '7px 14px', borderRadius: 7,
                        background: '#0f2a0f', border: '1px solid #1a3a1a',
                        color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        Publish
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button onClick={() => updateStatus(campaign.id, 'closed')} style={{
                        padding: '7px 14px', borderRadius: 7,
                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                        color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        Close
                      </button>
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