// src/app/api/applications/route.ts
// GET  — influencer's own applications
// POST — apply to a campaign (one-tap) + auto-generates fit score via Groq

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateFitScore, hashCampaignDescription } from '@/lib/groq'

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
        id, title, description, budget_range, timeline,
        niche_tags, status
      )
    `)
    .eq('influencer_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaign_id, contact_email } = await req.json()
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  const service = createServiceClient()

  // Check influencer profile exists
  const { data: profile } = await service
    .from('influencer_profiles')
    .select('id')
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

  const { data: application, error } = await service
    .from('applications')
    .insert({ campaign_id, influencer_id: user.id, status: 'pending', contact_email: contact_email?.trim() || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Auto-score in background ──────────────────────────────────────────────
  scoreApplicationInBackground(service, application.id, campaign_id, user.id)

  return NextResponse.json({ application }, { status: 201 })
}

// ── Background scorer ─────────────────────────────────────────────────────────
async function scoreApplicationInBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  applicationId: string,
  campaignId: string,
  influencerId: string
) {
  try {
    const { data: campaign } = await service
      .from('campaigns')
      .select('description')
      .eq('id', campaignId)
      .single()

    if (!campaign?.description?.trim()) return

    const { data: profile } = await service
      .from('influencer_profiles')
      .select('influencer_id')
      .eq('id', influencerId)
      .single()

    if (!profile?.influencer_id) return

    const { data: influencer } = await service
      .from('influencers')
      .select('id, profile_name, bio, industry, followers_count, engagement_rate, average_likes, average_comments')
      .eq('id', profile.influencer_id)
      .single()

    if (!influencer) return

    const campaignHash = hashCampaignDescription(campaign.description)

    // Check cache first
    const { data: cached } = await service
      .from('ai_fit_scores')
      .select('fit_score, fit_summary, match_reasons')
      .eq('influencer_id', influencer.id)
      .eq('campaign_hash', campaignHash)
      .single()

    let score: number, summary: string, matchReasons: string[]

    if (cached) {
      score        = cached.fit_score
      summary      = cached.fit_summary
      matchReasons = cached.match_reasons ?? []
    } else {
      const result = await generateFitScore(influencer, campaign.description)
      score        = result.score
      summary      = result.summary
      matchReasons = result.match_reasons

      await service.from('ai_fit_scores').insert({
        influencer_id:        influencer.id,
        campaign_hash:        campaignHash,
        campaign_description: campaign.description,
        fit_score:            score,
        fit_summary:          summary,
        match_reasons:        matchReasons,
      })
    }

    await service
      .from('applications')
      .update({ ai_fit_score: score, ai_fit_summary: summary, match_reasons: matchReasons })
      .eq('id', applicationId)

  } catch (err) {
    console.error('[scoreApplicationInBackground] error:', err)
  }
}