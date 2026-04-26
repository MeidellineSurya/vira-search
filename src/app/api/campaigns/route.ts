// src/app/api/campaigns/route.ts
// GET  /api/campaigns        — list campaigns (public: active only, marketer: all own)
// POST /api/campaigns        — create campaign (marketer auth required)

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === 'true'

  let query = supabase
    .from('campaigns')
    .select('id, title, description, niche_tags, budget_range, timeline, status, created_at, ideal_follower_min, ideal_follower_max')
    .order('created_at', { ascending: false })

  if (mine && user) {
    // Marketer fetching their own campaigns (all statuses)
    query = query.eq('marketer_id', user.id)
  } else {
    // Public — active only
    query = query.eq('status', 'active')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    title, description, niche_tags, content_type_tags,
    budget_range, timeline, ideal_follower_min, ideal_follower_max, status,
  } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  // Use service client so RLS doesn't block marketer_id check
  const service = createServiceClient()
  const { data, error } = await service
    .from('campaigns')
    .insert({
      marketer_id:       user.id,
      title:             title.trim(),
      description:       description?.trim() ?? null,
      niche_tags:        niche_tags ?? [],
      content_type_tags: content_type_tags ?? [],
      budget_range:      budget_range?.trim() ?? null,
      timeline:          timeline?.trim() ?? null,
      ideal_follower_min: ideal_follower_min ?? null,
      ideal_follower_max: ideal_follower_max ?? null,
      status:            status ?? 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data }, { status: 201 })
}