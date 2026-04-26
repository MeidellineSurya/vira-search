// src/app/dashboard/page.tsx
// Marketer dashboard — stub for now, will be expanded next session.
// Server component — reads auth server-side.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getProfile(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)

  // Influencers don't belong on the marketer dashboard
  if (profile?.role === 'influencer') redirect('/profile')

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
          <LogoutButton />
        </nav>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 40px' }}>
          {user.email}
        </p>

        {/* Placeholder — campaigns list goes here */}
        <div style={{
          border: '1px dashed #222', borderRadius: 12,
          padding: '48px', textAlign: 'center', color: '#333',
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
            + Create campaign
          </a>
        </div>
      </div>
    </div>
  )
}

// Client component for logout button
function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        style={{
          background: 'transparent', border: '1px solid #222',
          borderRadius: 6, padding: '5px 12px',
          fontSize: 12, color: '#555', cursor: 'pointer',
        }}
      >
        Log out
      </button>
    </form>
  )
}