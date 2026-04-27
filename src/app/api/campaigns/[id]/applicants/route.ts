// src/app/api/campaigns/[id]/applicants/route.ts
// GET   /api/campaigns/[id]/applicants — list applicants for marketer's campaign
// PATCH /api/campaigns/[id]/applicants — update application status

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Verify campaign ownership
  const { data: campaign } = await service
    .from('campaigns')
    .select('marketer_id')
    .eq('id', id)
    .single()

  if (campaign?.marketer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get applications joined with influencer scraped data + self profile
  const { data, error } = await service
    .from('applications')
    .select(`
      id, status, applied_at, ai_fit_score, ai_fit_summary, match_reasons,
      influencer_profiles (
        id, ig_handle, niche_tags, short_bio, audience_location,
        influencers (
          id, profile_name, bio, followers_count, engagement_rate,
          average_likes, average_comments, instagram_url, ai_summary
        )
      )
    `)
    .eq('campaign_id', id)
    .order('ai_fit_score', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applicants: data ?? [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id, status } = await req.json()
  const validStatuses = ['pending', 'viewed', 'selected', 'passed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify campaign ownership
  const { data: campaign } = await service
    .from('campaigns')
    .select('marketer_id')
    .eq('id', id)
    .single()

  if (campaign?.marketer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await service
    .from('applications')
    .update({ status })
    .eq('id', application_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}