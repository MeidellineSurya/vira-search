// src/lib/groq.ts
// Groq client + AI helper functions for VIRA
// All Groq calls go through here — single place to tweak models/costs

import Groq from 'groq-sdk'
import { createHash } from 'crypto'

// Singleton — one client per server process
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Cost strategy:
//   - Summaries: llama-3.3-70b (richer narrative, run once, cached)
//   - Fit scores: llama-3.1-8b (structured task, fast, cheap, cached)
const SUMMARY_MODEL = 'llama-3.3-70b-versatile'
const SCORE_MODEL   = 'llama-3.1-8b-instant'

export type Influencer = {
  id: string
  profile_name: string
  bio: string | null
  industry: string | null
  followers_count: number | null
  engagement_rate: number | null
  average_likes: number | null
  average_comments: number | null
}

// ── Summary ──────────────────────────────────────────────────────────────────
// Called once when a marketer clicks "Generate AI summary".
// Result is stored in influencers.ai_summary — never called again for same record.

export async function generateInfluencerSummary(influencer: Influencer): Promise<string> {
  const prompt = `You are a concise influencer analyst. 
Write a 2–3 sentence summary of this Instagram influencer for a marketer evaluating them for a campaign.
Focus on: what content they create, their audience size/engagement quality, and their collaboration vibe.
Be specific, not generic. Do not start with "This influencer".

Profile:
Handle: @${influencer.profile_name}
Bio: ${influencer.bio ?? 'No bio'}
Industry: ${influencer.industry ?? 'Unknown'}
Followers: ${influencer.followers_count?.toLocaleString() ?? 'Unknown'}
Engagement rate: ${influencer.engagement_rate ?? 'Unknown'}%
Avg likes: ${influencer.average_likes ?? 'Unknown'}
Avg comments: ${influencer.average_comments ?? 'Unknown'}

Summary:`

  const res = await groq.chat.completions.create({
    model: SUMMARY_MODEL,
    max_tokens: 150,
    temperature: 0.4,
    messages: [{ role: 'user', content: prompt }],
  })

  return res.choices[0]?.message?.content?.trim() ?? 'Summary unavailable.'
}

// ── Fit Score ─────────────────────────────────────────────────────────────────
// Called when a marketer has entered a campaign description and opens an influencer.
// Returns a score 0–100, a one-liner summary, and up to 3 match reasons.
// Result is cached in ai_fit_scores by (influencer_id, campaign_hash).

export type FitScoreResult = {
  score: number
  summary: string
  match_reasons: string[]
}

export async function generateFitScore(
  influencer: Influencer,
  campaignDescription: string
): Promise<FitScoreResult> {
  const prompt = `You are an influencer-campaign matching engine.
Score how well this influencer fits this campaign brief.

Return ONLY valid JSON. No explanation outside the JSON.
Format:
{
  "score": <integer 0-100>,
  "summary": "<one sentence explaining the fit>",
  "match_reasons": ["<reason 1>", "<reason 2>", "<reason 3>"]
}

Campaign brief:
${campaignDescription}

Influencer:
Handle: @${influencer.profile_name}
Bio: ${influencer.bio ?? 'No bio'}
Industry: ${influencer.industry ?? 'Unknown'}
Followers: ${influencer.followers_count?.toLocaleString() ?? 'Unknown'}
Engagement rate: ${influencer.engagement_rate ?? 'Unknown'}%`

  const res = await groq.chat.completions.create({
    model: SCORE_MODEL,
    max_tokens: 200,
    temperature: 0.1,   // Low temp for consistent structured output
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const raw = res.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw)
    return {
      score:         Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
      summary:       parsed.summary ?? '',
      match_reasons: Array.isArray(parsed.match_reasons) ? parsed.match_reasons.slice(0, 3) : [],
    }
  } catch {
    return { score: 0, summary: 'Could not generate score.', match_reasons: [] }
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

// Deterministic hash for caching fit scores by campaign description
export function hashCampaignDescription(description: string): string {
  return createHash('md5').update(description.trim().toLowerCase()).digest('hex')
}