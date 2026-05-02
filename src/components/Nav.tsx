'use client'

// src/components/Nav.tsx
// Single source of truth for navigation across ALL pages.
//
// MARKETER nav:  Search | Campaigns | Dashboard | Log out
// INFLUENCER nav: Campaigns | My applications | Profile | Log out
// LOGGED OUT nav: Search | Campaigns | Log in | Sign up

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const s = {
  primary:      '#0EA5E9',
  primaryLight: '#38BDF8',
  border:       '#E2E8F0',
  text:         '#1E293B',
  muted:        '#64748B',
  surface:      '#FFFFFF',
}

type Props = {
  active?: 'search' | 'campaigns' | 'dashboard' | 'applications' | 'profile'
}

export default function Nav({ active }: Props) {
  const router  = useRouter()
  const [role, setRole]     = useState<'marketer' | 'influencer' | null>(null)
  const [ready, setReady]   = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setReady(true); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      setRole(profile?.role as 'marketer' | 'influencer' | null)
      setReady(true)
    })
  }, [])

  const handleLogout = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const link = (label: string, href: string, key: string) => {
    const isActive = active === key
    return (
      <a key={key} href={href} style={{
        fontSize: 13, textDecoration: 'none', fontWeight: isActive ? 600 : 400,
        color: isActive ? s.primary : s.muted,
        borderBottom: isActive ? `2px solid ${s.primary}` : '2px solid transparent',
        paddingBottom: 2, transition: 'color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = s.primary)}
        onMouseLeave={e => (e.currentTarget.style.color = isActive ? s.primary : s.muted)}>
        {label}
      </a>
    )
  }

  const logoutBtn = (
    <button onClick={handleLogout} style={{
      background: 'transparent', border: `1.5px solid ${s.border}`,
      borderRadius: 7, padding: '5px 14px',
      fontSize: 12, color: s.muted, cursor: 'pointer',
      transition: 'border-color 0.15s, color 0.15s', fontFamily: 'inherit',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.color = s.muted }}>
      Log out
    </button>
  )

  const authLinks = (
    <>
      <a href="/login" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', transition: 'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = s.text)}
        onMouseLeave={e => (e.currentTarget.style.color = s.muted)}>
        Log in
      </a>
      <a href="/signup" style={{
        padding: '7px 18px', borderRadius: 7,
        background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
        color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(14,165,233,0.25)',
      }}>
        Sign up
      </a>
    </>
  )

  return (
    <div style={{
      borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: s.surface, position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 3px rgba(30,41,59,0.06)',
    }}>
      {/* Logo */}
      <a href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: s.primary, letterSpacing: '0.04em' }}>
          VIRA
        </span>
      </a>

      {/* Nav links — only render once role is resolved to avoid flicker */}
      {ready && (
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {role === 'marketer' && (
            <>
              {link('Search', '/search', 'search')}
              {link('Campaigns', '/campaigns', 'campaigns')}
              {link('Dashboard', '/dashboard', 'dashboard')}
              {logoutBtn}
            </>
          )}

          {role === 'influencer' && (
            <>
              {link('Campaigns', '/campaigns', 'campaigns')}
              {link('My applications', '/applications', 'applications')}
              {link('Profile', '/profile', 'profile')}
              {logoutBtn}
            </>
          )}

          {!role && (
            <>
              {link('Search', '/search', 'search')}
              {link('Campaigns', '/campaigns', 'campaigns')}
              {authLinks}
            </>
          )}
        </nav>
      )}
    </div>
  )
}