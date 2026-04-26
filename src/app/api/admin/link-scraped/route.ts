// src/app/api/admin/link-scraped/route.ts
// POST /api/admin/link-scraped
// Called after you've manually scraped and inserted an influencer's data.
// Links their influencer_profiles row to the new influencers row,
// marks the scrape_request as done, then triggers AI scoring for
// any pending applications they have.
//
// Protected by ADMIN_SECRET env var — call with:
// curl -X POST https://yourdomain.com/api/admin/link-scraped \
//   -H "Content-Type: application/json" \
//   -H "x-admin-secret: YOUR_ADMIN_SECRET" \
//   -d '{ "ig_handle": "somehandle" }'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateFitScore, hashCampaignDescription } from '@/lib/groq'

export async function POST(req: NextRequest) {
  // Auth check — simple shared secret
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { ig_handle } = await req.json()
  if (!ig_handle?.trim()) {
    return NextResponse.json({ error: 'ig_handle required' }, { status: 400 })
  }

  const handle  = ig_handle.trim().replace(/^@/, '').toLowerCase()
  const service = createServiceClient()

  // 1. Find the scraped record
  const { data: scraped } = await service
    .from('influencers')
    .select('id')
    .ilike('profile_name', handle)
    .single()

  if (!scraped) {
    return NextResponse.json({
      error: `No scraped record found for @${handle}. Insert into influencers table first.`
    }, { status: 404 })
  }

  // 2. Find the influencer_profiles row
  const { data: profile } = await service
    .from('influencer_profiles')
    .select('id')
    .ilike('ig_handle', handle)
    .single()

  if (!profile) {
    return NextResponse.json({
      error: `No influencer_profiles row found for @${handle}. Have they signed up?`
    }, { status: 404 })
  }

  // 3. Link them
  await service
    .from('influencer_profiles')
    .update({ influencer_id: scraped.id, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  // 4. Mark scrape request as done
  await service
    .from('scrape_requests')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .ilike('ig_handle', handle)

  // 5. Backfill AI scores for any pending applications this influencer has
  const { data: applications } = await service
    .from('applications')
    .select('id, campaign_id')
    .eq('influencer_id', profile.id)
    .is('ai_fit_score', null)

  let scored = 0
  if (applications && applications.length > 0) {
    const { data: influencer } = await service
      .from('influencers')
      .select('id, profile_name, bio, industry, followers_count, engagement_rate, average_likes, average_comments')
      .eq('id', scraped.id)
      .single()

    for (const app of applications) {
      try {
        const { data: campaign } = await service
          .from('campaigns')
          .select('description')
          .eq('id', app.campaign_id)
          .single()

        if (!campaign?.description?.trim()) continue

        const campaignHash = hashCampaignDescription(campaign.description)

        // Check cache
        const { data: cached } = await service
          .from('ai_fit_scores')
          .select('fit_score, fit_summary, match_reasons')
          .eq('influencer_id', scraped.id)
          .eq('campaign_hash', campaignHash)
          .single()

        let score: number, summary: string, matchReasons: string[]

        if (cached) {
          score        = cached.fit_score
          summary      = cached.fit_summary
          matchReasons = cached.match_reasons ?? []
        } else {
          if (!influencer) continue
          const result = await generateFitScore(influencer, campaign.description)
          score        = result.score
          summary      = result.summary
          matchReasons = result.match_reasons

          await service.from('ai_fit_scores').insert({
            influencer_id:        scraped.id,
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
          .eq('id', app.id)

        scored++
      } catch (err) {
        console.error(`[link-scraped] scoring failed for app ${app.id}:`, err)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    handle,
    linked_profile_id:   profile.id,
    linked_influencer_id: scraped.id,
    applications_scored: scored,
  })
}