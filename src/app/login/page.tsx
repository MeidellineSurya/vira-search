'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8' }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) { setError(error?.message ?? 'Login failed'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'influencer' ? '/campaigns' : '/dashboard')
    router.refresh()
  }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: '#fff',
    border: `1.5px solid ${s.border}`, borderRadius: 8, padding: '11px 14px',
    fontSize: 14, color: s.text, outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0F9FF 0%, #fff 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', padding: 24 }}>
      <a href="/" style={{ textDecoration: 'none', marginBottom: 36 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: s.primary, letterSpacing: '0.04em' }}>VIRA</span>
      </a>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '36px 32px', boxShadow: '0 4px 24px rgba(14,165,233,0.08)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: s.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: s.muted, margin: '0 0 28px' }}>Sign in to your VIRA account</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={input}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <a href="/reset-password" style={{ fontSize: 12, color: s.primary, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={input}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
          </div>

          {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            marginTop: 6, padding: '12px', border: 'none', borderRadius: 8,
            background: loading ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
            color: loading ? s.faint : '#fff', fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            boxShadow: loading ? 'none' : '0 2px 12px rgba(14,165,233,0.3)',
          }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontSize: 13, color: s.muted, margin: '24px 0 0', textAlign: 'center' }}>
          Don't have an account?{' '}
          <a href="/signup" style={{ color: s.primary, textDecoration: 'none', fontWeight: 600 }}>Sign up</a>
        </p>
      </div>
    </div>
  )
}