// src/app/api/ai/summary/route.ts
// POST /api/ai/summary
// Body: { influencer_id: string }
//
// Cost strategy: generate once, store in influencers.ai_summary, never regenerate.
// Returns cached summary immediately if already generated.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateInfluencerSummary } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { influencer_id } = body

  if (!influencer_id) {
    return NextResponse.json({ error: 'influencer_id required' }, { status: 400 })
  }

  // Service client — needs to write back to influencers table
  const supabase = createServiceClient()

  // Fetch the influencer
  const { data: influencer, error: fetchError } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', influencer_id)
    .single()

  if (fetchError || !influencer) {
    return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
  }

  // Return cached summary if it exists — zero Groq cost
  if (influencer.ai_summary) {
    return NextResponse.json({
      summary: influencer.ai_summary,
      cached: true,
    })
  }

  // Generate summary via Groq (llama-3.3-70b, ~150 tokens)
  try {
    const summary = await generateInfluencerSummary(influencer)

    // Cache it back to DB — will never call Groq again for this influencer
    await supabase
      .from('influencers')
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', influencer_id)

    return NextResponse.json({ summary, cached: false })
  } catch (err) {
    console.error('[ai/summary] Groq error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}