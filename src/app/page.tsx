'use client'

// src/app/page.tsx
// VIRA Landing Page
// Aesthetic: editorial luxury — tight typography, amber accents, precise motion

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
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const s = {
    // colours
    bg:       '#080808',
    surface:  '#111111',
    border:   '#1c1c1c',
    amber:    '#d4a847',
    amberDim: '#8a6c2a',
    text:     '#f0ede8',
    muted:    '#5a5855',
    faint:    '#2a2826',

    // type
    display: '"Playfair Display", Georgia, serif',
    body:    '"DM Sans", "Helvetica Neue", sans-serif',
  }

  return (
    <div style={{ background: s.bg, color: s.text, fontFamily: s.body, overflowX: 'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${s.border}` : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <span style={{ fontFamily: s.display, fontSize: 22, fontWeight: 700, letterSpacing: '0.05em', color: s.text }}>
          VIRA
        </span>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="/search"    style={{ fontSize: 13, color: s.muted, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = s.text)}
            onMouseLeave={e => (e.currentTarget.style.color = s.muted)}>
            Search
          </a>
          <a href="/campaigns" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = s.text)}
            onMouseLeave={e => (e.currentTarget.style.color = s.muted)}>
            Campaigns
          </a>
          <a href="/login" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = s.text)}
            onMouseLeave={e => (e.currentTarget.style.color = s.muted)}>
            Log in
          </a>
          <a href="/signup" style={{
            fontSize: 12, fontWeight: 700,
            padding: '8px 20px', borderRadius: 6,
            background: s.amber, color: '#000',
            textDecoration: 'none', letterSpacing: '0.03em',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Get started
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 80px',
        position: 'relative', textAlign: 'center',
      }}>
        {/* Background grain */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          opacity: 0.6,
        }} />

        {/* Amber glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,168,71,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 40,
            border: `1px solid ${s.amberDim}`,
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: s.amber, marginBottom: 36,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.6s ease 0ms',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.amber, display: 'inline-block' }} />
            Influencer marketing, reimagined
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: s.display,
            fontSize: 'clamp(48px, 8vw, 88px)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            margin: '0 0 28px',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 100ms',
          }}>
            Find creators who
            <br />
            <span style={{ color: s.amber }}>actually fit.</span>
          </h1>

          {/* Subhead */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 19px)',
            color: s.muted, lineHeight: 1.7,
            maxWidth: 560, margin: '0 auto 48px',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 200ms',
          }}>
            VIRA searches scraped Instagram profiles and uses AI to score each creator
            against your specific campaign — so you spend time connecting, not filtering.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 300ms',
          }}>
            <a href="/search" style={{
              padding: '14px 32px', borderRadius: 8,
              background: s.amber, color: '#000',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              letterSpacing: '0.02em', transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Search influencers free →
            </a>
            <a href="/signup" style={{
              padding: '14px 32px', borderRadius: 8,
              background: 'transparent',
              border: `1px solid ${s.border}`,
              color: s.muted, fontSize: 14, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.muted; e.currentTarget.style.color = s.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.color = s.muted }}>
              Post a campaign
            </a>
          </div>

          {/* Social proof */}
          <p style={{
            fontSize: 12, color: s.muted, marginTop: 28,
            opacity: heroVisible ? 1 : 0,
            transition: 'all 0.7s ease 400ms',
          }}>
            118 Melbourne food & lifestyle creators indexed · No account needed to search
          </p>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${s.border}`,
        borderBottom: `1px solid ${s.border}`,
        padding: '14px 0', overflow: 'hidden',
        background: s.surface,
      }}>
        <div style={{
          display: 'flex', gap: 48, whiteSpace: 'nowrap',
          animation: 'marquee 28s linear infinite',
        }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ fontSize: 12, color: s.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {item}
              <span style={{ color: s.amberDim, margin: '0 24px' }}>✦</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <p style={{ fontSize: 11, color: s.amber, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            How it works
          </p>
          <h2 style={{ fontFamily: s.display, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 72px', maxWidth: 500 }}>
            From search to shortlist in minutes.
          </h2>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
          {[
            {
              n: '01', title: 'Search without signing up',
              body: 'Browse 118 scraped Instagram profiles by keyword, niche, or handle. See follower counts, engagement rates, and bios instantly.',
              cta: 'Try the search →', href: '/search',
            },
            {
              n: '02', title: 'Describe your campaign',
              body: 'Enter your campaign brief — product, tone, target audience. VIRA\'s AI scores every creator against your specific goals.',
              cta: null, href: null,
            },
            {
              n: '03', title: 'Open a profile, get a score',
              body: 'Click any creator to generate an AI summary and fit score with match reasons. Cached so you\'re never billed twice.',
              cta: null, href: null,
            },
            {
              n: '04', title: 'Post a campaign, get applicants',
              body: 'Publish your brief. Influencers apply with one tap. Review ranked applicants — scored and sorted automatically.',
              cta: 'Create campaign →', href: '/signup',
            },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={i * 80}>
              <div style={{
                padding: '40px 36px',
                background: s.surface,
                border: `1px solid ${s.border}`,
                borderRadius: 2,
                height: '100%', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = s.faint)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = s.border)}>
                <span style={{ fontFamily: s.display, fontSize: 48, fontWeight: 700, color: s.faint, display: 'block', marginBottom: 20 }}>
                  {step.n}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.7, margin: 0 }}>
                  {step.body}
                </p>
                {step.cta && (
                  <a href={step.href!} style={{
                    display: 'inline-block', marginTop: 20,
                    fontSize: 12, color: s.amber, textDecoration: 'none',
                    letterSpacing: '0.04em',
                  }}>
                    {step.cta}
                  </a>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── For marketers / For influencers ─────────────────────────────── */}
      <section style={{ padding: '0 40px 120px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {/* Marketers */}
          <FadeIn>
            <div style={{
              padding: '56px 48px',
              background: s.surface,
              border: `1px solid ${s.border}`,
              borderRadius: '2px 0 0 2px',
            }}>
              <p style={{ fontSize: 11, color: s.amber, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                For marketers
              </p>
              <h3 style={{ fontFamily: s.display, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 20px', lineHeight: 1.2 }}>
                Stop scrolling Instagram manually.
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Search 118 creators with real engagement data',
                  'AI scores each creator against your campaign brief',
                  'Post campaigns and review ranked applicants',
                  'Move forward with one click — contact externally',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: s.muted, lineHeight: 1.5 }}>
                    <span style={{ color: s.amber, flexShrink: 0, marginTop: 1 }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/search" style={{
                display: 'inline-block', padding: '12px 24px',
                background: s.amber, color: '#000',
                borderRadius: 6, fontSize: 13, fontWeight: 700,
                textDecoration: 'none', transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Search free →
              </a>
            </div>
          </FadeIn>

          {/* Influencers */}
          <FadeIn delay={100}>
            <div style={{
              padding: '56px 48px',
              background: '#0d0d0d',
              border: `1px solid ${s.border}`,
              borderRadius: '0 2px 2px 0',
            }}>
              <p style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                For influencers
              </p>
              <h3 style={{ fontFamily: s.display, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 20px', lineHeight: 1.2 }}>
                Find campaigns that suit your style.
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Browse live brand campaigns in your niche',
                  'Apply with one tap — no lengthy forms',
                  'Your Instagram data speaks for you',
                  'Track application status in real time',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: s.muted, lineHeight: 1.5 }}>
                    <span style={{ color: s.muted, flexShrink: 0, marginTop: 1 }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/campaigns" style={{
                display: 'inline-block', padding: '12px 24px',
                background: 'transparent',
                border: `1px solid ${s.border}`,
                color: s.muted, borderRadius: 6,
                fontSize: 13, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.muted; e.currentTarget.style.color = s.text }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.color = s.muted }}>
                Browse campaigns →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section style={{
        margin: '0 40px 120px',
        padding: '80px 60px',
        background: s.surface,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,168,71,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <FadeIn>
          <h2 style={{
            fontFamily: s.display,
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: 700, letterSpacing: '-0.02em',
            margin: '0 0 16px', position: 'relative',
          }}>
            Ready to find your next creator?
          </h2>
          <p style={{ fontSize: 16, color: s.muted, margin: '0 0 36px', position: 'relative' }}>
            No account needed. Start searching in seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <a href="/search" style={{
              padding: '14px 36px', borderRadius: 8,
              background: s.amber, color: '#000',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Search influencers →
            </a>
            <a href="/signup" style={{
              padding: '14px 36px', borderRadius: 8,
              background: 'transparent', border: `1px solid ${s.border}`,
              color: s.muted, fontSize: 14, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.muted; e.currentTarget.style.color = s.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.color = s.muted }}>
              Create account
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${s.border}`,
        padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <span style={{ fontFamily: s.display, fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', color: s.muted }}>
          VIRA
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Search', '/search'], ['Campaigns', '/campaigns'], ['Log in', '/login'], ['Sign up', '/signup']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 12, color: s.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = s.text)}
              onMouseLeave={e => (e.currentTarget.style.color = s.muted)}>
              {label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: s.muted, margin: 0 }}>
          © {new Date().getFullYear()} VIRA
        </p>
      </footer>
    </div>
  )
}