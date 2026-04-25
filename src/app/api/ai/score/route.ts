// src/app/api/ai/score/route.ts
// POST /api/ai/score
// Body: { influencer_id: string, campaign_description: string }
//
// Cost strategy:
//   - Hash campaign_description → check ai_fit_scores cache first
//   - Only call Groq (llama-3.1-8b) on cache miss
//   - Cache result permanently per (influencer_id, campaign_hash)

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateFitScore, hashCampaignDescription } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { influencer_id, campaign_description } = body

  if (!influencer_id || !campaign_description?.trim()) {
    return NextResponse.json(
      { error: 'influencer_id and campaign_description required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const campaign_hash = hashCampaignDescription(campaign_description)

  // Check cache first — free
  const { data: cached } = await supabase
    .from('ai_fit_scores')
    .select('fit_score, fit_summary, match_reasons')
    .eq('influencer_id', influencer_id)
    .eq('campaign_hash', campaign_hash)
    .single()

  if (cached) {
    return NextResponse.json({
      score:         cached.fit_score,
      summary:       cached.fit_summary,
      match_reasons: cached.match_reasons,
      cached:        true,
    })
  }

  // Fetch influencer for context
  const { data: influencer, error: fetchError } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', influencer_id)
    .single()

  if (fetchError || !influencer) {
    return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
  }

  // Generate score via Groq (llama-3.1-8b, ~200 tokens)
  try {
    const result = await generateFitScore(influencer, campaign_description)

    // Store in cache
    await supabase.from('ai_fit_scores').insert({
      influencer_id,
      campaign_hash,
      campaign_description,
      fit_score:     result.score,
      fit_summary:   result.summary,
      match_reasons: result.match_reasons,
    })

    return NextResponse.json({ ...result, cached: false })
  } catch (err) {
    console.error('[ai/score] Groq error:', err)
    return NextResponse.json({ error: 'AI scoring failed' }, { status: 500 })
  }
}