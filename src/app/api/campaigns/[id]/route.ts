// src/app/api/campaigns/[id]/route.ts
// GET   /api/campaigns/[id]  — single campaign detail
// PATCH /api/campaigns/[id]  — update status (marketer only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, title, description, niche_tags, content_type_tags,
      budget_range, timeline, status, created_at,
      ideal_follower_min, ideal_follower_max, marketer_id
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ campaign: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['status', 'title', 'description', 'budget_range', 'timeline']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updated_at = new Date().toISOString()

  const service = createServiceClient()

  // Verify ownership first
  const { data: campaign } = await service
    .from('campaigns')
    .select('marketer_id')
    .eq('id', id)
    .single()

  if (campaign?.marketer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await service
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data })
}