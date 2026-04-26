// src/app/api/profile/influencer/route.ts
// GET  — get current influencer's profile + linked scraped data
// POST — create/update influencer profile + queue scrape if no match found

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
      id:                user.id,
      ig_handle:         handle,
      niche_tags:        niche_tags ?? [],
      short_bio:         short_bio?.trim() ?? null,
      audience_location: audience_location?.trim() ?? null,
      influencer_id:     scraped?.id ?? null,
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If no scraped match — queue a scrape request and notify admin
  if (!scraped) {
    queueScrapeRequest(service, handle, user.id)
  }

  return NextResponse.json({ profile: data })
}

// ── Scrape request queue ──────────────────────────────────────────────────────

async function queueScrapeRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  handle: string,
  userId: string
) {
  try {
    // Upsert — don't create duplicates if they update their profile
    const { error } = await service
      .from('scrape_requests')
      .upsert(
        { ig_handle: handle, requested_by: userId, status: 'pending', updated_at: new Date().toISOString() },
        { onConflict: 'ig_handle', ignoreDuplicates: true }
      )

    if (error) {
      console.error('[queueScrapeRequest] DB error:', error.message)
      return
    }

    // Send email notification to admin
    await notifyAdmin(handle, userId)

  } catch (err) {
    console.error('[queueScrapeRequest] error:', err)
  }
}

async function notifyAdmin(handle: string, userId: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  const resendKey  = process.env.RESEND_API_KEY

  if (!adminEmail || !resendKey) {
    // No email config — just log to console (visible in Vercel logs)
    console.log(`[SCRAPE REQUEST] New unscraped influencer signed up: @${handle} (user: ${userId})`)
    return
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from:    'VIRA <noreply@yourdomain.com>',   // ← update with your domain
        to:      adminEmail,
        subject: `[VIRA] New scrape request: @${handle}`,
        html: `
          <h2>New influencer signup — scrape needed</h2>
          <p><strong>Instagram handle:</strong> @${handle}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p>This influencer signed up on VIRA but has no scraped data yet.</p>
          <h3>To action this:</h3>
          <ol>
            <li>Scrape <a href="https://instagram.com/${handle}">@${handle}</a> via Apify or manually</li>
            <li>Insert the data into the <code>influencers</code> table with <code>profile_name = '${handle}'</code></li>
            <li>Call the admin link endpoint to connect their profile:<br/>
              <code>POST /api/admin/link-scraped</code><br/>
              <code>{ "ig_handle": "${handle}" }</code>
            </li>
          </ol>
          <p>Or view all pending requests in Supabase:<br/>
          <code>select * from scrape_requests where status = 'pending' order by created_at desc;</code></p>
        `,
      }),
    })
  } catch (err) {
    console.error('[notifyAdmin] email send failed:', err)
  }
}