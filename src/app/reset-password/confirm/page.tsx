'use client'

// src/app/reset-password/confirm/page.tsx
// Step 2: User lands here from email link with token in URL hash
// Supabase handles token validation and expiry (1 hour default)

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8' }

export default function ResetConfirmPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [validSession, setValid]  = useState(false)
  const [checking, setChecking]   = useState(true)

  useEffect(() => {
    // Supabase exchanges the token from the URL hash automatically
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValid(true)
        setChecking(false)
      }
    })
    // Timeout fallback
    setTimeout(() => setChecking(false), 3000)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: '#fff',
    border: `1.5px solid ${s.border}`, borderRadius: 8, padding: '11px 14px',
    fontSize: 14, color: s.text, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0F9FF 0%, #fff 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', padding: 24 }}>
      <a href="/" style={{ textDecoration: 'none', marginBottom: 36 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: s.primary }}>VIRA</span>
      </a>

      <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '36px 32px', boxShadow: '0 4px 24px rgba(14,165,233,0.08)' }}>
        {checking ? (
          <p style={{ textAlign: 'center', color: s.faint, fontSize: 14 }}>Verifying reset link…</p>
        ) : done ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>✅</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: s.text, margin: '0 0 10px', textAlign: 'center' }}>Password updated!</h1>
            <p style={{ fontSize: 14, color: s.muted, textAlign: 'center', margin: 0 }}>Redirecting you to login…</p>
          </>
        ) : !validSession ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: s.text, margin: '0 0 10px', textAlign: 'center' }}>Invalid or expired link</h1>
            <p style={{ fontSize: 14, color: s.muted, margin: '0 0 24px', textAlign: 'center', lineHeight: 1.6 }}>
              This reset link has expired or already been used. Reset links are valid for 1 hour.
            </p>
            <a href="/reset-password" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 8, background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Request a new link
            </a>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: s.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Set new password</h1>
            <p style={{ fontSize: 14, color: s.muted, margin: '0 0 28px' }}>Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" style={input}
                  onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
                <p style={{ fontSize: 11, color: s.faint, margin: '5px 0 0' }}>Minimum 6 characters</p>
              </div>
              <div>
                <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" style={input}
                  onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
              </div>
              {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ padding: '12px', border: 'none', borderRadius: 8, background: loading ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: loading ? s.faint : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 2px 12px rgba(14,165,233,0.3)' }}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}