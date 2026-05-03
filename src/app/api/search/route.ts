// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse, sanitizeText, getClientIp, log } from '@/lib/security'

export async function GET(req: NextRequest) {
  // Rate limit by IP (search is public)
  const ip = getClientIp(req)
  const { allowed, resetAt } = await checkRateLimit(req, '/api/search', ip)
  if (!allowed) return rateLimitResponse(resetAt)

  const { searchParams } = new URL(req.url)

  // Sanitise query params
  const rawQ   = searchParams.get('q') ?? ''
  const q      = sanitizeText(rawQ, 200) ?? ''
  const limit  = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20'), 1), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0)

  const supabase = await createClient()

  let query = supabase
    .from('influencers')
    .select('id, profile_name, bio, industry, followers_count, engagement_rate, average_likes, average_comments, instagram_url, ai_summary, ai_summary_generated_at')
    .order('followers_count', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    // Use ilike for partial match (FTS index handles performance)
    query = query.or(
      `profile_name.ilike.%${q}%,bio.ilike.%${q}%,industry.ilike.%${q}%`
    )
  }

  const { data, error } = await query

  if (error) {
    log('warn', 'search_error', { error: error.message })
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({ results: data ?? [] })
}