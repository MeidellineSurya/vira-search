// src/app/api/ai/score/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateFitScore, hashCampaignDescription } from '@/lib/groq'
import {
  checkRateLimit, rateLimitResponse,
  isFeatureEnabled, featureDisabledResponse,
  log, logError, logAI,
  sanitizeText, getClientIp,
} from '@/lib/security'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const identifier = user?.id ?? getClientIp(req)
  const { allowed, remaining, resetAt } = await checkRateLimit(req, '/api/ai/score', identifier)
  if (!allowed) return rateLimitResponse(resetAt)

  if (!(await isFeatureEnabled('ai_scoring'))) {
    return featureDisabledResponse('ai_scoring')
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const influencer_id        = sanitizeText(body.influencer_id as string, 36)
  const campaign_description = sanitizeText(body.campaign_description as string, 5000)

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!influencer_id || !uuidRegex.test(influencer_id)) {
    return NextResponse.json({ error: 'Invalid influencer_id' }, { status: 400 })
  }
  if (!campaign_description?.trim()) {
    return NextResponse.json({ error: 'campaign_description required' }, { status: 400 })
  }

  const service = createServiceClient()
  const campaign_hash = hashCampaignDescription(campaign_description)

  // Cache check
  const { data: cached } = await service
    .from('ai_fit_scores')
    .select('fit_score, fit_summary, match_reasons')
    .eq('influencer_id', influencer_id)
    .eq('campaign_hash', campaign_hash)
    .single()

  if (cached) {
    log('info', 'ai_score_cache_hit', { influencer_id })
    return NextResponse.json({ score: cached.fit_score, summary: cached.fit_summary, match_reasons: cached.match_reasons, cached: true })
  }

  const { data: influencer } = await service
    .from('influencers')
    .select('id, profile_name, bio, industry, followers_count, engagement_rate, average_likes, average_comments')
    .eq('id', influencer_id)
    .single()

  if (!influencer) {
    return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
  }

  try {
    logAI('ai_score_generate', { influencer_id, remaining_rate_limit: remaining })
    const result = await generateFitScore(influencer, campaign_description)

    await service.from('ai_fit_scores').insert({
      influencer_id,
      campaign_hash,
      campaign_description,
      fit_score:     result.score,
      fit_summary:   result.summary,
      match_reasons: result.match_reasons,
    })

    return NextResponse.json({ ...result, cached: false })
  } catch (err) {
    logError('ai_score_failed', err, { influencer_id })
    return NextResponse.json({ error: 'AI scoring failed. Please try again.' }, { status: 500 })
  }
}