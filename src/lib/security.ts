// src/lib/security.ts
// Central security utilities for VIRA
// Covers: input sanitisation, validation, rate limiting, logging, feature flags

import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// ── LOGGING ───────────────────────────────────────────────────────────────────
// Structured logging — only meaningful events, not noisy debug output.
// In production these go to Vercel logs and can be piped to an alerting tool.

type LogLevel = 'info' | 'warn' | 'error'

export function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  // Skip verbose info logs in production to keep costs down
  if (process.env.NODE_ENV === 'production' && level === 'info') return

  const entry = {
    ts:    new Date().toISOString(),
    level,
    event,
    env:   process.env.NODE_ENV,
    ...data,
  }
  if (level === 'error') console.error(JSON.stringify(entry))
  else if (level === 'warn') console.warn(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

// Always log these regardless of level (errors, security events, AI calls)
export function logError(event: string, err: unknown, data?: Record<string, unknown>) {
  log('error', event, { error: err instanceof Error ? err.message : String(err), ...data })
}

export function logSecurity(event: string, data?: Record<string, unknown>) {
  // Always log security events — rate limits, auth failures, injection attempts
  const entry = { ts: new Date().toISOString(), level: 'security', event, env: process.env.NODE_ENV, ...data }
  console.warn(JSON.stringify(entry))
}

export function logAI(event: string, data?: Record<string, unknown>) {
  // Always log AI calls for cost tracking
  const entry = { ts: new Date().toISOString(), level: 'ai', event, ...data }
  console.log(JSON.stringify(entry))
}

// ── INPUT SANITISATION ────────────────────────────────────────────────────────
// Strip XSS vectors and enforce length limits before any DB write.

// Remove HTML tags and dangerous characters
export function sanitizeText(input: unknown, maxLength = 2000): string | null {
  if (input == null || input === '') return null
  if (typeof input !== 'string') return null

  return input
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // strip js: protocol
    .replace(/on\w+\s*=/gi, '')        // strip event handlers
    .replace(/[<>'"]/g, c => ({        // encode remaining dangerous chars
      '<': '&lt;', '>': '&gt;',
      "'": '&#x27;', '"': '&quot;',
    }[c] ?? c))
    .trim()
    .slice(0, maxLength) || null
}

// Sanitise and validate an email address
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim().toLowerCase().slice(0, 254)
  const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/
  return emailRegex.test(trimmed) ? trimmed : null
}

// Sanitise Instagram handle — alphanumeric, dots, underscores only
export function sanitizeHandle(input: unknown): string | null {
  if (typeof input !== 'string') return null
  return input
    .trim()
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 30) || null
}

// Sanitise a URL
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  try {
    const url = new URL(input.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.href.slice(0, 500)
  } catch { return null }
}

// Sanitise a string array (niche tags etc.)
export function sanitizeStringArray(input: unknown, maxItems = 10, maxItemLength = 50): string[] {
  if (!Array.isArray(input)) return []
  return input
    .filter(item => typeof item === 'string')
    .map(item => sanitizeText(item, maxItemLength) ?? '')
    .filter(Boolean)
    .slice(0, maxItems)
}

// Sanitise integer with bounds check
export function sanitizeInt(input: unknown, min?: number, max?: number): number | null {
  const n = parseInt(String(input), 10)
  if (isNaN(n)) return null
  if (min !== undefined && n < min) return null
  if (max !== undefined && n > max) return null
  return n
}

// ── VALIDATION ────────────────────────────────────────────────────────────────

export type ValidationResult = { ok: true } | { ok: false; error: string; status: number }

export function validateCampaignInput(body: Record<string, unknown>): ValidationResult {
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
    return { ok: false, error: 'Title must be at least 3 characters', status: 400 }
  }
  if (body.title.length > 200) {
    return { ok: false, error: 'Title too long (max 200 characters)', status: 400 }
  }
  if (body.description && typeof body.description === 'string' && body.description.length > 5000) {
    return { ok: false, error: 'Description too long (max 5000 characters)', status: 400 }
  }
  const validStatuses = ['draft', 'active', 'closed']
  if (body.status && !validStatuses.includes(body.status as string)) {
    return { ok: false, error: 'Invalid status', status: 400 }
  }
  return { ok: true }
}

export function validateApplicationInput(body: Record<string, unknown>): ValidationResult {
  if (!body.campaign_id || typeof body.campaign_id !== 'string') {
    return { ok: false, error: 'campaign_id required', status: 400 }
  }
  // Basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(body.campaign_id)) {
    return { ok: false, error: 'Invalid campaign_id', status: 400 }
  }
  if (body.contact_email) {
    const email = sanitizeEmail(body.contact_email)
    if (!email) return { ok: false, error: 'Invalid email format', status: 400 }
  }
  return { ok: true }
}

export function validateInfluencerProfileInput(body: Record<string, unknown>): ValidationResult {
  if (!body.ig_handle) {
    return { ok: false, error: 'Instagram handle is required', status: 400 }
  }
  const handle = sanitizeHandle(body.ig_handle)
  if (!handle || handle.length < 1) {
    return { ok: false, error: 'Invalid Instagram handle', status: 400 }
  }
  return { ok: true }
}

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
// Token bucket per (identifier + endpoint) per time window.
// Uses Supabase for state (stateless API routes, works across serverless instances).

type RateLimitConfig = { windowMs: number; maxRequests: number }

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/ai/summary': { windowMs: 60_000, maxRequests: 10 },   // 10/min per user
  '/api/ai/score':   { windowMs: 60_000, maxRequests: 20 },   // 20/min per user
  '/api/search':     { windowMs: 60_000, maxRequests: 60 },   // 60/min per IP
  '/api/applications': { windowMs: 60_000, maxRequests: 5 },  // 5 applications/min
  default:           { windowMs: 60_000, maxRequests: 100 },
}

export async function checkRateLimit(
  req: NextRequest,
  endpoint: string,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[endpoint] ?? RATE_LIMITS.default
  const identifier = userId ?? getClientIp(req)
  const windowStart = new Date(Math.floor(Date.now() / config.windowMs) * config.windowMs)
  const windowKey = windowStart.toISOString()
  const resetAt = new Date(windowStart.getTime() + config.windowMs)

  try {
    const supabase = createServiceClient()

    // Upsert request count for this window
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      p_identifier:   identifier,
      p_endpoint:     endpoint,
      p_window_start: windowKey,
    })

    if (error) {
      // If RPC doesn't exist yet, fail open (don't block users)
      logError('rate_limit_check_failed', error, { endpoint, identifier })
      return { allowed: true, remaining: config.maxRequests, resetAt }
    }

    const count = data as number
    const allowed = count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count)

    if (!allowed) {
      logSecurity('rate_limit_exceeded', { endpoint, identifier, count })
    }

    return { allowed, remaining, resetAt }
  } catch (err) {
    logError('rate_limit_error', err, { endpoint })
    return { allowed: true, remaining: config.maxRequests, resetAt } // fail open
  }
}

// Rate limit response helper
export function rateLimitResponse(resetAt: Date): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
        'X-RateLimit-Reset': resetAt.toISOString(),
      },
    }
  )
}

// ── FEATURE FLAGS (AI KILL SWITCH) ────────────────────────────────────────────
// Check feature_flags table before any AI call.
// To disable AI: update feature_flags set enabled = false where key = 'ai_summary';

const flagCache = new Map<string, { value: boolean; expiresAt: number }>()
const FLAG_CACHE_TTL = 30_000 // 30 seconds — balance freshness vs DB calls

export async function isFeatureEnabled(flag: string): Promise<boolean> {
  // Check in-memory cache first
  const cached = flagCache.get(flag)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', flag)
      .single()

    const enabled = data?.enabled ?? true
    flagCache.set(flag, { value: enabled, expiresAt: Date.now() + FLAG_CACHE_TTL })
    return enabled
  } catch (err) {
    logError('feature_flag_check_failed', err, { flag })
    return true // fail open
  }
}

export function featureDisabledResponse(flag: string): NextResponse {
  log('warn', 'feature_disabled', { flag })
  return NextResponse.json(
    { error: 'This feature is temporarily unavailable. Please try again later.' },
    { status: 503 }
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// Hash sensitive values for logging (never log raw emails/handles)
export function hashForLog(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8)
}