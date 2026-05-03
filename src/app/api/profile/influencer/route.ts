// src/app/api/profile/influencer/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  validateInfluencerProfileInput,
  sanitizeHandle, sanitizeText, sanitizeStringArray,
  log, logError,
} from '@/lib/security'

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

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const validation = validateInfluencerProfileInput(body)
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: validation.status })

  const handle            = sanitizeHandle(body.ig_handle)
  const short_bio         = sanitizeText(body.short_bio as string, 500)
  const audience_location = sanitizeText(body.audience_location as string, 100)
  const niche_tags        = sanitizeStringArray(body.niche_tags, 10, 50)

  if (!handle) return NextResponse.json({ error: 'Invalid Instagram handle' }, { status: 400 })

  const service = createServiceClient()

  const { data: scraped } = await service
    .from('influencers').select('id').ilike('profile_name', handle).single()

  const { data, error } = await service
    .from('influencer_profiles')
    .upsert({
      id: user.id, ig_handle: handle, niche_tags, short_bio,
      audience_location, influencer_id: scraped?.id ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select().single()

  if (error) {
    logError('influencer_profile_upsert_failed', error, { user_id: user.id })
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  log('info', 'influencer_profile_saved', { matched_scraped: !!scraped?.id })
  if (!scraped) queueScrapeRequest(service, handle, user.id)

  return NextResponse.json({ profile: data })
}

async function queueScrapeRequest(service: any, handle: string, userId: string) {
  try {
    await service.from('scrape_requests').upsert(
      { ig_handle: handle, requested_by: userId, status: 'pending', updated_at: new Date().toISOString() },
      { onConflict: 'ig_handle', ignoreDuplicates: true }
    )
    const adminEmail = process.env.ADMIN_EMAIL
    const resendKey  = process.env.RESEND_API_KEY
    const domain     = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'virasearch.vercel.app'
    if (!adminEmail || !resendKey) { console.log('[SCRAPE REQUEST] @' + handle); return }
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + resendKey },
      body: JSON.stringify({
        from: 'VIRA <noreply@' + domain + '>',
        to: adminEmail,
        subject: '[VIRA] Scrape request: @' + handle,
        html: '<p><strong>@' + handle + '</strong> signed up without scraped data.<br/><a href="https://' + domain + '/admin/scrape-queue?secret=' + process.env.ADMIN_SECRET + '">View admin queue</a></p>',
      }),
    })
  } catch (err) { logError('scrape_request_error', err, { handle }) }
}