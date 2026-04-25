// src/app/api/search/route.ts
// GET /api/search?q=keyword&limit=20&offset=0
// Returns influencers matching keyword via Postgres full-text search.
// No AI calls here — fast, cheap, always runs.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q      = searchParams.get('q')?.trim() ?? ''
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = await createClient()

  let query = supabase
    .from('influencers')
    .select('id, profile_name, bio, industry, followers_count, engagement_rate, average_likes, average_comments, instagram_url, ai_summary, ai_summary_generated_at')
    .order('followers_count', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    // Postgres full-text search across profile_name, bio, industry
    query = query.textSearch(
      'fts',
      q.split(' ').map(w => w + ':*').join(' & '),
      { config: 'english', type: 'plain' }
    )
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[search] Supabase error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({ results: data ?? [], total: count ?? 0 })
}