'use client'

// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

const s = { primary: '#0EA5E9', border: '#E2E8F0', text: '#1E293B', muted: '#64748B' }

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(JSON.stringify({
      ts: new Date().toISOString(), level: 'error',
      event: 'react_error_boundary',
      error: error.message,
      stack: info.componentStack?.slice(0, 300),
    }))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', padding: 24, textAlign: 'center' }}>
          <div style={{ background: '#fff', border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '40px 48px', maxWidth: 480, boxShadow: '0 2px 12px rgba(30,41,59,0.08)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: s.text, margin: '0 0 10px' }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: s.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 8, background: `linear-gradient(135deg, ${s.primary}, #38BDF8)`, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Refresh page
              </button>
              <a href="/" style={{ padding: '10px 24px', borderRadius: 8, background: 'transparent', border: `1.5px solid ${s.border}`, color: s.muted, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Go home
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ padding: '6px 14px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          Retry
        </button>
      )}
    </div>
  )
}

export function FeatureDisabled({ message = 'This feature is temporarily unavailable.' }: { message?: string }) {
  return (
    <div style={{ padding: '14px 18px', background: '#FEF9C3', border: '1.5px solid #FEF08A', borderRadius: 10 }}>
      <p style={{ fontSize: 13, color: '#854D0E', margin: 0 }}>⚠ {message}</p>
    </div>
  )
}