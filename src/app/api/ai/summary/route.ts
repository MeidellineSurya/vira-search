// src/app/api/ai/summary/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateInfluencerSummary } from '@/lib/groq'
import {
  checkRateLimit, rateLimitResponse,
  isFeatureEnabled, featureDisabledResponse,
  log, logError, logAI,
  sanitizeText, getClientIp,
} from '@/lib/security'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Rate limit — per user if authed, per IP if not
  const identifier = user?.id ?? getClientIp(req)
  const { allowed, remaining, resetAt } = await checkRateLimit(req, '/api/ai/summary', identifier)
  if (!allowed) return rateLimitResponse(resetAt)

  // AI kill switch
  if (!(await isFeatureEnabled('ai_summary'))) {
    return featureDisabledResponse('ai_summary')
  }

  // Parse and validate body
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const influencer_id = sanitizeText(body.influencer_id as string, 36)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!influencer_id || !uuidRegex.test(influencer_id)) {
    return NextResponse.json({ error: 'Invalid influencer_id' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: influencer, error: fetchError } = await service
    .from('influencers')
    .select('id, profile_name, bio, industry, followers_count, engagement_rate, average_likes, average_comments, ai_summary, ai_summary_generated_at')
    .eq('id', influencer_id)
    .single()

  if (fetchError || !influencer) {
    return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
  }

  // Return cached summary if exists
  if (influencer.ai_summary) {
    log('info', 'ai_summary_cache_hit', { influencer_id })
    return NextResponse.json({ summary: influencer.ai_summary, cached: true })
  }

  try {
    logAI('ai_summary_generate', { influencer_id, remaining_rate_limit: remaining })
    const summary = await generateInfluencerSummary(influencer)

    await service
      .from('influencers')
      .update({ ai_summary: summary, ai_summary_generated_at: new Date().toISOString() })
      .eq('id', influencer_id)

    return NextResponse.json({ summary, cached: false })
  } catch (err) {
    logError('ai_summary_failed', err, { influencer_id })
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }
}