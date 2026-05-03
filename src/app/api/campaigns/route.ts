// src/app/api/campaigns/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  validateCampaignInput, sanitizeText, sanitizeStringArray, sanitizeInt,
  log, logError,
} from '@/lib/security'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, description, notes, niche_tags, content_type_tags, budget_range, timeline, status, created_at, ideal_follower_min, ideal_follower_max')
    .order('created_at', { ascending: false })
    .eq(mine && user ? 'marketer_id' : 'status', mine && user ? user.id : 'active')

  if (error) {
    logError('campaigns_get_failed', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }

  // Strip internal notes from public responses
  const campaigns = (data ?? []).map(c => {
    if (mine && user) return c
    const { notes: _, ...pub } = c
    return pub
  })

  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = validateCampaignInput(body)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status })
  }

  // Sanitise all fields
  const title             = sanitizeText(body.title as string, 200)!
  const description       = sanitizeText(body.description as string, 5000)
  const notes             = sanitizeText(body.notes as string, 2000)       // internal only
  const budget_range      = sanitizeText(body.budget_range as string, 100)
  const timeline          = sanitizeText(body.timeline as string, 100)
  const niche_tags        = sanitizeStringArray(body.niche_tags, 10, 50)
  const content_type_tags = sanitizeStringArray(body.content_type_tags, 10, 50)
  const ideal_follower_min = sanitizeInt(body.ideal_follower_min, 0, 100_000_000)
  const ideal_follower_max = sanitizeInt(body.ideal_follower_max, 0, 100_000_000)
  const status            = ['draft', 'active', 'closed'].includes(body.status as string)
    ? body.status as string : 'draft'

  const service = createServiceClient()
  const { data, error } = await service
    .from('campaigns')
    .insert({
      marketer_id: user.id,
      title, description, notes,
      budget_range, timeline,
      niche_tags, content_type_tags,
      ideal_follower_min, ideal_follower_max,
      status,
    })
    .select()
    .single()

  if (error) {
    logError('campaign_insert_failed', error, { user_id: user.id })
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }

  log('info', 'campaign_created', { campaign_id: data.id, status })
  return NextResponse.json({ campaign: data }, { status: 201 })
}