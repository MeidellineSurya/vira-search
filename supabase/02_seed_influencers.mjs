/**
 * VIRA — Influencer seed script
 *
 * Usage:
 *   1. npm install @supabase/supabase-js
 *   2. Set env vars (or create a .env.local and load with dotenv):
 *        SUPABASE_URL=https://xxxx.supabase.co
 *        SUPABASE_SERVICE_KEY=your-service-role-key   ← NOT the anon key
 *   3. node 02_seed_influencers.mjs
 *
 * The service role key bypasses RLS so we can bulk insert.
 * Never expose this key client-side.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── helpers ──────────────────────────────────────────────────────────────────

function toFloat(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function toInt(val) {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

function cleanBio(bio) {
  if (!bio) return null
  // Remove excess whitespace/newlines from multiline bios in the CSV
  return bio.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ').trim() || null
}

function cleanUrl(url) {
  if (!url) return null
  const trimmed = url.trim()
  // Strip tracking params (utm_source etc.) for cleanliness
  try {
    const u = new URL(trimmed)
    return `${u.origin}${u.pathname}`.replace(/\/$/, '')
  } catch {
    return trimmed || null
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url))

// Adjust path to wherever you placed the CSV
const CSV_PATH = join(__dir, 'influencers-export-2026-04-21_19-11-26.csv')

let raw
try {
  raw = readFileSync(CSV_PATH, 'utf-8')
} catch {
  console.error(`❌  Could not read CSV at: ${CSV_PATH}`)
  console.error('    Place the CSV in the same folder as this script.')
  process.exit(1)
}

const records = parse(raw, {
  delimiter: ';',
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true,
})

console.log(`📄  Parsed ${records.length} rows from CSV`)

const rows = records
  .filter(r => r.profile_name?.trim())   // drop blank profile_name rows
  .map(r => ({
    id:               r.id?.trim() || undefined,  // keep original UUIDs if present
    profile_name:     r.profile_name.trim(),
    bio:              cleanBio(r.bio),
    industry:         r.industry?.trim() || 'Food',
    average_comments: toFloat(r.average_comments),
    average_likes:    toFloat(r.average_likes),
    engagement_rate:  toFloat(r.engagement_rate),
    followers_count:  toInt(r.followers_count),
    instagram_url:    cleanUrl(r.instagram_url),
    // ai_summary left null — generated on demand
  }))

console.log(`✅  ${rows.length} valid rows after cleaning`)

// Upsert in batches of 50 (Supabase recommends < 500 per call)
const BATCH = 50
let inserted = 0
let skipped = 0

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH)
  const { error } = await supabase
    .from('influencers')
    .upsert(batch, { onConflict: 'profile_name', ignoreDuplicates: false })

  if (error) {
    console.error(`❌  Error on batch ${i}–${i + batch.length}:`, error.message)
    skipped += batch.length
  } else {
    inserted += batch.length
    console.log(`   ↑ batch ${i + 1}–${i + batch.length} upserted`)
  }
}

console.log(`\n🎉  Done. ${inserted} upserted, ${skipped} failed.`)
