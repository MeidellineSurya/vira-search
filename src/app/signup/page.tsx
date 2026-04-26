'use client'

// src/app/signup/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Role = 'marketer' | 'influencer'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole]             = useState<Role>('marketer')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [companyName, setCompany]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 1. Create auth user
    const { data, error: signupError } = await supabase.auth.signUp({ email, password })

    if (signupError || !data.user) {
      setError(signupError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    // 2. Create profile via API (uses service role to bypass RLS)
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:      data.user.id,
        role,
        company_name: role === 'marketer' ? companyName : undefined,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Profile creation failed')
      setLoading(false)
      return
    }

    // 3. Redirect based on role
    router.push(role === 'marketer' ? '/dashboard' : '/profile')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
      padding: '24px',
    }}>
      {/* Logo */}
      <a href="/" style={{ textDecoration: 'none', marginBottom: 40 }}>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0f0f0' }}>
          VIRA
        </span>
      </a>

      <div style={{
        width: '100%', maxWidth: 440,
        background: '#111', border: '1px solid #1e1e1e',
        borderRadius: 16, padding: '36px 32px',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          Create your account
        </h1>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 28px' }}>
          Join VIRA to find and connect with creators
        </p>

        {/* Role selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          {(['marketer', 'influencer'] as Role[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                padding: '12px',
                background: role === r ? '#1a1a1a' : 'transparent',
                border: `1px solid ${role === r ? '#d4a847' : '#222'}`,
                borderRadius: 8,
                color: role === r ? '#d4a847' : '#555',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {r === 'marketer' ? '🎯 Marketer' : '📸 Influencer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Company name — only for marketers */}
          {role === 'marketer' && (
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Co."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0a0a0a', border: '1px solid #222',
                  borderRadius: 8, padding: '11px 14px',
                  fontSize: 14, color: '#f0f0f0', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e  => (e.target.style.borderColor = '#222')}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0a0a0a', border: '1px solid #222',
                borderRadius: 8, padding: '11px 14px',
                fontSize: 14, color: '#f0f0f0', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#444')}
              onBlur={e  => (e.target.style.borderColor = '#222')}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0a0a0a', border: '1px solid #222',
                borderRadius: 8, padding: '11px 14px',
                fontSize: 14, color: '#f0f0f0', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#444')}
              onBlur={e  => (e.target.style.borderColor = '#222')}
            />
            <p style={{ fontSize: 11, color: '#444', margin: '5px 0 0' }}>Minimum 6 characters</p>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              background: loading ? '#1a1a1a' : '#f0f0f0',
              color: loading ? '#444' : '#0a0a0a',
              border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Creating account…' : `Create ${role} account`}
          </button>
        </form>

        <p style={{ fontSize: 13, color: '#444', margin: '24px 0 0', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#d4a847', textDecoration: 'none' }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}