'use client'

import { useEffect, useRef, useState } from 'react'

const MARQUEE_ITEMS = [
  'Find the right creator', 'AI-powered matching', 'Melbourne food scene',
  'Campaign fit scoring', 'Scraped Instagram data', 'No cold outreach',
  'One-tap applications', 'Real engagement rates',
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>{children}</div>
  )
}

const s = {
  primary:      '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryDark:  '#0284C7',
  secondary:    '#F0F9FF',
  accent:       '#DDF4FF',
  bg:           '#FFFFFF',
  bgMuted:      '#F1F5F9',
  border:       '#E2E8F0',
  text:         '#1E293B',
  muted:        '#64748B',
  faint:        '#94A3B8',
  shadow:       '0 4px 24px rgba(14,165,233,0.14)',
  shadowCard:   '0 2px 12px rgba(30,41,59,0.08)',
}

export default function LandingPage() {
  const [scrolled, setScrolled]       = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: s.bg, color: s.text, fontFamily: '"DM Sans", sans-serif', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${s.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: s.primary, letterSpacing: '0.04em' }}>
          VIRA
        </span>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {[['Search', '/search'], ['Campaigns', '/campaigns'], ['Log in', '/login']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 14, color: s.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = s.text)}
              onMouseLeave={e => (e.currentTarget.style.color = s.muted)}>{label}</a>
          ))}
          <a href="/signup" style={{
            padding: '9px 22px', borderRadius: 8,
            background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
            color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(14,165,233,0.3)', transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Get started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 65%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 80px', textAlign: 'center', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: '12%', right: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '14%', left: '6%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px', borderRadius: 40,
            background: s.accent, border: `1px solid ${s.primaryLight}`,
            fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: s.primaryDark, marginBottom: 32,
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.6s ease',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.primary, display: 'inline-block' }} />
            Influencer marketing, reimagined
          </div>

          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 'clamp(44px, 7.5vw, 82px)',
            fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.02em',
            color: s.text, margin: '0 0 24px',
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 100ms',
          }}>
            Find creators who<br />
            <span style={{ background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              actually fit.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', color: s.muted, lineHeight: 1.75,
            maxWidth: 540, margin: '0 auto 44px',
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 180ms',
          }}>
            VIRA searches scraped Instagram profiles and uses AI to score each creator
            against your specific campaign — so you spend time connecting, not filtering.
          </p>

          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 260ms',
          }}>
            <a href="/search" style={{
              padding: '14px 32px', borderRadius: 10,
              background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`,
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(14,165,233,0.35)', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(14,165,233,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,165,233,0.35)' }}>
              Search influencers free →
            </a>
            <a href="/signup" style={{
              padding: '14px 32px', borderRadius: 10, background: '#fff',
              border: `1.5px solid ${s.border}`, color: s.text,
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              boxShadow: s.shadowCard, transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = s.primary)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = s.border)}>
              Post a campaign
            </a>
          </div>

          <p style={{ fontSize: 12, color: s.faint, marginTop: 24, opacity: heroVisible ? 1 : 0, transition: 'all 0.7s ease 340ms' }}>
            118 Melbourne food & lifestyle creators indexed · No account needed to search
          </p>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}`, padding: '13px 0', overflow: 'hidden', background: s.bgMuted }}>
        <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', animation: 'marquee 28s linear infinite' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ fontSize: 11, color: s.muted, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              {item}<span style={{ color: s.primaryLight, margin: '0 20px' }}>✦</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>

      {/* How it works */}
      <section style={{ padding: '100px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <p style={{ fontSize: 11, color: s.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontWeight: 600 }}>How it works</p>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 64px', color: s.text, maxWidth: 440 }}>
            From search to shortlist in minutes.
          </h2>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { n: '01', title: 'Search without signing up', body: 'Browse scraped Instagram profiles by keyword, niche, or handle. See follower counts, engagement rates, and bios instantly.', cta: 'Try the search →', href: '/search' },
            { n: '02', title: 'Describe your campaign', body: "Enter your campaign brief. VIRA's AI scores every creator against your specific goals and tone.", cta: null, href: null },
            { n: '03', title: 'Open a profile, get a score', body: 'Click any creator to generate an AI summary and fit score with match reasons. Cached so you\'re never billed twice.', cta: null, href: null },
            { n: '04', title: 'Post a campaign, get applicants', body: 'Publish your brief. Influencers apply with one tap. Review ranked applicants — scored and sorted automatically.', cta: 'Create campaign →', href: '/signup' },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={i * 70}>
              <div style={{
                padding: '32px 28px', background: '#fff',
                border: `1.5px solid ${s.border}`, borderRadius: 14,
                boxShadow: s.shadowCard, height: '100%', boxSizing: 'border-box',
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = s.shadow; e.currentTarget.style.borderColor = s.primaryLight }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = s.shadowCard; e.currentTarget.style.borderColor = s.border }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: s.accent, fontFamily: '"Playfair Display", serif', display: 'block', marginBottom: 14, lineHeight: 1 }}>{step.n}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: s.text }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                {step.cta && <a href={step.href!} style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: s.primary, textDecoration: 'none', fontWeight: 600 }}>{step.cta}</a>}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* For marketers / influencers */}
      <section style={{ padding: '0 40px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FadeIn>
            <div style={{ padding: '52px 44px', borderRadius: 16, background: `linear-gradient(145deg, ${s.secondary}, #fff)`, border: `1.5px solid ${s.border}`, boxShadow: s.shadowCard }}>
              <p style={{ fontSize: 11, color: s.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, fontWeight: 600 }}>For marketers</p>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 18px', color: s.text, lineHeight: 1.2 }}>
                Stop scrolling Instagram manually.
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Search 118 creators with real engagement data', 'AI scores each creator against your campaign brief', 'Post campaigns and review ranked applicants', 'Move forward with one click — contact externally'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: s.muted, lineHeight: 1.5 }}>
                    <span style={{ color: s.primary, flexShrink: 0 }}>›</span>{item}
                  </li>
                ))}
              </ul>
              <a href="/search" style={{ display: 'inline-block', padding: '11px 24px', background: `linear-gradient(135deg, ${s.primary}, ${s.primaryLight})`, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 12px rgba(14,165,233,0.3)' }}>
                Search free →
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div style={{ padding: '52px 44px', borderRadius: 16, background: '#fff', border: `1.5px solid ${s.border}`, boxShadow: s.shadowCard }}>
              <p style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, fontWeight: 600 }}>For influencers</p>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 18px', color: s.text, lineHeight: 1.2 }}>
                Find campaigns that suit your style.
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Browse live brand campaigns in your niche', 'Apply with one tap — no lengthy forms', 'Your Instagram data speaks for you', 'Track application status in real time'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: s.muted, lineHeight: 1.5 }}>
                    <span style={{ color: s.faint, flexShrink: 0 }}>›</span>{item}
                  </li>
                ))}
              </ul>
              <a href="/campaigns" style={{ display: 'inline-block', padding: '11px 24px', background: '#fff', border: `1.5px solid ${s.border}`, color: s.text, borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = s.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = s.border)}>
                Browse campaigns →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA banner */}
      <section style={{
        margin: '0 40px 100px', padding: '80px 60px',
        background: `linear-gradient(135deg, ${s.primary} 0%, ${s.primaryLight} 100%)`,
        borderRadius: 20, textAlign: 'center',
        boxShadow: '0 8px 48px rgba(14,165,233,0.28)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <FadeIn>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 14px' }}>
            Ready to find your next creator?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.82)', margin: '0 0 36px' }}>No account needed. Start searching in seconds.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/search" style={{ padding: '14px 36px', borderRadius: 10, background: '#fff', color: s.primaryDark, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Search influencers →
            </a>
            <a href="/signup" style={{ padding: '14px 36px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}>
              Create account
            </a>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${s.border}`, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: s.primary }}>VIRA</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Search', '/search'], ['Campaigns', '/campaigns'], ['Log in', '/login'], ['Sign up', '/signup']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 12, color: s.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = s.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = s.muted)}>{label}</a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: s.faint, margin: 0 }}>© {new Date().getFullYear()} VIRA</p>
      </footer>
    </div>
  )
}