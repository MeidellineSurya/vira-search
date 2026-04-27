'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Role = 'marketer' | 'influencer'
const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', accent: '#DDF4FF', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8' }

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole]           = useState<Role>('marketer')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [companyName, setCompany] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError || !data.user) { setError(signupError?.message ?? 'Signup failed'); setLoading(false); return }
    const res = await fetch('/api/auth/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: data.user.id, role, company_name: role === 'marketer' ? companyName : undefined }),
    })
    if (!res.ok) { const b = await res.json(); setError(b.error ?? 'Profile creation failed'); setLoading(false); return }
    router.push(role === 'marketer' ? '/dashboard' : '/profile'); router.refresh()
  }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#fff', border: `1.5px solid ${s.border}`,
    borderRadius: 8, padding: '11px 14px',
    fontSize: 14, color: s.text, outline: 'none',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0F9FF 0%, #fff 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', padding: 24 }}>
      <a href="/" style={{ textDecoration: 'none', marginBottom: 36 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: s.primary, letterSpacing: '0.04em' }}>VIRA</span>
      </a>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '36px 32px', boxShadow: '0 4px 24px rgba(14,165,233,0.08)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: s.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Create your account</h1>
        <p style={{ fontSize: 14, color: s.muted, margin: '0 0 24px' }}>Join VIRA to find and connect with creators</p>

        {/* Role selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          {(['marketer', 'influencer'] as Role[]).map(r => (
            <button key={r} type="button" onClick={() => setRole(r)} style={{
              padding: '12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              background: role === r ? s.accent : 'transparent',
              border: `1.5px solid ${role === r ? s.primary : s.border}`,
              color: role === r ? s.primary : s.muted,
              fontSize: 13, fontWeight: 600,
            }}>
              {r === 'marketer' ? '🎯 Marketer' : '📸 Influencer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {role === 'marketer' && (
            <div>
              <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company name</label>
              <input type="text" value={companyName} onChange={e => setCompany(e.target.value)} placeholder="Acme Co." style={input}
                onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={input}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} style={input}
              onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
            <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>Minimum 6 characters</p>
          </div>
          {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            marginTop: 6, padding: '12px', border: 'none', borderRadius: 8,
            background: loading ? '#f1f5f9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
            color: loading ? s.faint : '#fff',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 2px 12px rgba(14,165,233,0.3)',
          }}>
            {loading ? 'Creating account…' : `Create ${role} account`}
          </button>
        </form>
        <p style={{ fontSize: 13, color: s.muted, margin: '24px 0 0', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: s.primary, textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}