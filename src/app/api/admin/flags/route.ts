// src/app/api/admin/flags/route.ts
// GET  — list all feature flags
// PATCH — toggle a flag (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logSecurity, sanitizeText } from '@/lib/security'

function authCheck(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return !!(secret && secret === process.env.ADMIN_SECRET)
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    logSecurity('admin_flags_unauthorized', { ip: req.headers.get('x-forwarded-for') ?? 'unknown' })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('feature_flags')
    .select('key, enabled, note, updated_at')
    .order('key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ flags: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!authCheck(req)) {
    logSecurity('admin_flags_unauthorized', { ip: req.headers.get('x-forwarded-for') ?? 'unknown' })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const key     = sanitizeText(body.key, 100)
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : null

  if (!key || enabled === null) {
    return NextResponse.json({ error: 'key and enabled (boolean) required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', event: 'feature_flag_toggled', key, enabled }))
  return NextResponse.json({ flag: data })
}