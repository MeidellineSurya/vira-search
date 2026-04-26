// src/app/api/applications/route.ts
// GET  — influencer's own applications
// POST — apply to a campaign (one-tap)

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('applications')
    .select(`
      id, status, applied_at, ai_fit_score,
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

  const { campaign_id } = await req.json()
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

  const { data, error } = await service
    .from('applications')
    .insert({ campaign_id, influencer_id: user.id, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data }, { status: 201 })
}