'use client'

// src/app/login/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
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
        width: '100%', maxWidth: 400,
        background: '#111', border: '1px solid #1e1e1e',
        borderRadius: 16, padding: '36px 32px',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 28px' }}>
          Sign in to your VIRA account
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontSize: 13, color: '#444', margin: '24px 0 0', textAlign: 'center' }}>
          Don't have an account?{' '}
          <a href="/signup" style={{ color: '#d4a847', textDecoration: 'none' }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}