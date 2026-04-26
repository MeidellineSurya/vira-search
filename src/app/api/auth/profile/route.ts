// src/app/api/auth/profile/route.ts
// POST /api/auth/profile
// Called after Supabase signup to create the profiles row + role-specific row.
// Uses service client to bypass RLS on insert.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { user_id, role, company_name, role_title } = await req.json()

  if (!user_id || !role) {
    return NextResponse.json({ error: 'user_id and role required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Insert into profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: user_id, role })

  if (profileError) {
    console.error('[auth/profile] profiles insert error:', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Insert role-specific profile
  if (role === 'marketer') {
    const { error } = await supabase
      .from('marketer_profiles')
      .insert({ id: user_id, company_name: company_name ?? null, role_title: role_title ?? null })
    if (error) {
      console.error('[auth/profile] marketer_profiles insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (role === 'influencer') {
    const { error } = await supabase
      .from('influencer_profiles')
      .insert({ id: user_id })
    if (error) {
      console.error('[auth/profile] influencer_profiles insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}