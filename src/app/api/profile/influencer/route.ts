// src/app/api/profile/influencer/route.ts
// GET  — get current influencer's profile + linked scraped data
// POST — create/update influencer profile

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('influencer_profiles')
    .select(`
      id, ig_handle, niche_tags, short_bio, audience_location,
      influencers (
        id, profile_name, bio, followers_count, engagement_rate,
        average_likes, average_comments, instagram_url, ai_summary
      )
    `)
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ profile: null })
  return NextResponse.json({ profile: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ig_handle, niche_tags, short_bio, audience_location } = await req.json()

  if (!ig_handle?.trim()) {
    return NextResponse.json({ error: 'Instagram handle is required' }, { status: 400 })
  }

  const service = createServiceClient()
  const handle  = ig_handle.trim().replace(/^@/, '').toLowerCase()

  // Try to find matching scraped influencer record
  const { data: scraped } = await service
    .from('influencers')
    .select('id')
    .ilike('profile_name', handle)
    .single()

  // Upsert influencer profile
  const { data, error } = await service
    .from('influencer_profiles')
    .upsert({
      id:               user.id,
      ig_handle:        handle,
      niche_tags:       niche_tags ?? [],
      short_bio:        short_bio?.trim() ?? null,
      audience_location: audience_location?.trim() ?? null,
      influencer_id:    scraped?.id ?? null,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}