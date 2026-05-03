// src/app/api/applications/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateFitScore, hashCampaignDescription } from '@/lib/groq'
import { isFeatureEnabled } from '@/lib/security'
import {
  checkRateLimit, rateLimitResponse,
  validateApplicationInput,
  sanitizeText, sanitizeEmail,
  log, logError,
} from '@/lib/security'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('applications')
    .select(`
      id, status, applied_at, ai_fit_score, contact_email,
      campaigns (
        id, title, description, budget_range, timeline, niche_tags, status
      )
    `)
    .eq('influencer_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) {
    logError('applications_get_failed', error, { user_id: user.id })
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }

  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit applications
  const { allowed, resetAt } = await checkRateLimit(req, '/api/applications', user.id)
  if (!allowed) return rateLimitResponse(resetAt)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate
  const validation = validateApplicationInput(body)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status })
  }

  // Sanitise
  const campaign_id    = sanitizeText(body.campaign_id as string, 36)!
  const contact_email  = sanitizeEmail(body.contact_email)

  const service = createServiceClient()

  // Verify influencer profile exists
  const { data: profile } = await service
    .from('influencer_profiles')
    .select('id, influencer_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Complete your profile before applying' }, { status: 400 })
  }

  // Check not already applied
  const { data: existing } = await service
    .from('applications')
    .select('id')
    .eq('campaign_id', campaign_id)
    .eq('influencer_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already applied to this campaign' }, { status: 409 })
  }

  // Verify campaign is active
  const { data: campaign } = await service
    .from('campaigns')
    .select('id, status')
    .eq('id', campaign_id)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }
  if (campaign.status !== 'active') {
    return NextResponse.json({ error: 'This campaign is no longer accepting applications' }, { status: 400 })
  }

  const { data: application, error } = await service
    .from('applications')
    .insert({
      campaign_id,
      influencer_id: user.id,
      status: 'pending',
      contact_email: contact_email ?? null,
    })
    .select()
    .single()

  if (error) {
    logError('application_insert_failed', error, { campaign_id })
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }

  log('info', 'application_submitted', { campaign_id })

  // Auto-score in background
  scoreApplicationInBackground(service, application.id, campaign_id, user.id, profile.influencer_id)

  return NextResponse.json({ application }, { status: 201 })
}

// ── Background scorer ─────────────────────────────────────────────────────────
async function scoreApplicationInBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  applicationId: string,
  campaignId: string,
  influencerId: string,
  scrapedInfluencerId: string | null
) {
  try {
    if (!(await isFeatureEnabled('ai_auto_score'))) return
    if (!scrapedInfluencerId) return

    const { data: campaign } = await service.from('campaigns').select('description').eq('id', campaignId).single()
    if (!campaign?.description?.trim()) return

    const { data: influencer } = await service
      .from('influencers')
      .select('id, profile_name, bio, industry, followers_count, engagement_rate, average_likes, average_comments')
      .eq('id', scrapedInfluencerId)
      .single()
    if (!influencer) return

    const campaignHash = hashCampaignDescription(campaign.description)

    const { data: cached } = await service
      .from('ai_fit_scores')
      .select('fit_score, fit_summary, match_reasons')
      .eq('influencer_id', influencer.id)
      .eq('campaign_hash', campaignHash)
      .single()

    let score: number, summary: string, matchReasons: string[]

    if (cached) {
      score = cached.fit_score; summary = cached.fit_summary; matchReasons = cached.match_reasons ?? []
    } else {
      const result = await generateFitScore(influencer, campaign.description)
      score = result.score; summary = result.summary; matchReasons = result.match_reasons

      await service.from('ai_fit_scores').insert({
        influencer_id: influencer.id, campaign_hash: campaignHash,
        campaign_description: campaign.description, fit_score: score,
        fit_summary: summary, match_reasons: matchReasons,
      })
    }

    await service.from('applications')
      .update({ ai_fit_score: score, ai_fit_summary: summary, match_reasons: matchReasons })
      .eq('id', applicationId)

  } catch (err) {
    logError('auto_score_failed', err, { applicationId })
  }
}