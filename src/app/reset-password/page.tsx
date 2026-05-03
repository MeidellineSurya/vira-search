'use client'

// src/app/reset-password/page.tsx
// Step 1: User enters email → receives reset link (expires in 1 hour via Supabase config)
// Step 2: User clicks link → lands on /reset-password/confirm with token in URL

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const s = { primary: '#0EA5E9', primaryLight: '#38BDF8', border: '#E2E8F0', text: '#1E293B', muted: '#64748B', faint: '#94A3B8' }

export default function ResetPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
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
        {sent ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>📬</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: s.text, margin: '0 0 10px', textAlign: 'center' }}>Check your email</h1>
            <p style={{ fontSize: 14, color: s.muted, margin: '0 0 24px', textAlign: 'center', lineHeight: 1.6 }}>
              We've sent a password reset link to <strong>{email}</strong>.
              The link expires in <strong>1 hour</strong>.
            </p>
            <p style={{ fontSize: 12, color: s.faint, textAlign: 'center', margin: 0 }}>
              Didn't get it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: s.primary, fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 600 }}>
                try again
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: s.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Reset password</h1>
            <p style={{ fontSize: 14, color: s.muted, margin: '0 0 28px' }}>Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={input}
                  onFocus={e => (e.target.style.borderColor = s.primary)} onBlur={e => (e.target.style.borderColor = s.border)} />
              </div>
              {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ padding: '12px', border: 'none', borderRadius: 8, background: loading ? '#F1F5F9' : `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: loading ? s.faint : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 2px 12px rgba(14,165,233,0.3)' }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p style={{ fontSize: 13, color: s.muted, margin: '24px 0 0', textAlign: 'center' }}>
              <a href="/login" style={{ color: s.primary, textDecoration: 'none', fontWeight: 600 }}>← Back to login</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}