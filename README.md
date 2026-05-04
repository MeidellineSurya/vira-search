# VIRA — Influencer Search & Campaign Platform

> AI-powered influencer discovery and campaign management for the Melbourne food and lifestyle scene.

**Live:** [vira-search.vercel.app](https://vira-search.vercel.app)

---

## What is VIRA?

VIRA connects marketers with the right Instagram influencers — fast. Instead of scrolling Instagram manually, marketers search a database of scraped creator profiles, describe their campaign, and let AI score the fit. Influencers browse live brand campaigns and apply in seconds.

No cold outreach. No spreadsheets. No guesswork.

---

## Features

### For Marketers
- **Influencer search** — keyword search across 118+ scraped Melbourne food & lifestyle creators, sorted by followers
- **AI summaries** — generate a concise creator summary on demand, cached permanently after first generation
- **Campaign fit scoring** — enter a campaign brief and get a 0–100 fit score with match reasons per influencer, cached per (influencer × campaign) pair
- **Campaign dashboard** — create, publish, and manage campaigns with draft/active/closed status
- **Applicant review panel** — review applicants ranked by AI fit score, with scraped stats, self-written bio, AI summary, applicant notes, and contact email in one view
- **Shareable campaign links** — each campaign has a public URL to share externally
- **Internal notes** — private notes on campaigns visible only to the marketer

### For Influencers
- **Campaign board** — browse all active brand campaigns with brief, budget, timeline, and content format
- **One-tap apply** — apply with contact email and an optional note to the marketer (availability, content style, etc.)
- **Profile** — self-entered bio, niche tags, and Instagram handle automatically matched to scraped data
- **Application tracker** — track status (pending / viewed / selected / passed) across all campaigns applied to

### For Admins
- **Scrape queue** — new unscraped influencer signups queue automatically, email notification sent, "Link & score" button backfills AI scores retroactively
- **AI kill switches** — per-flag toggles for `ai_summary`, `ai_scoring`, `ai_auto_score` with a "Kill all AI" emergency button
- **Feature flags page** — `/admin/flags?secret=YOUR_SECRET`
- **Scrape queue page** — `/admin/scrape-queue?secret=YOUR_SECRET`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind-compatible inline styles |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth — email/password, password reset with 1hr expiry |
| AI | Groq API — `llama-3.3-70b` for summaries, `llama-3.1-8b` for scoring |
| Deployment | Vercel |
| Email | Resend |

---

## Architecture

```
User (browser)
    │
    ▼
Next.js (Vercel)
├── /app/               Page routes
├── /api/               API route handlers
│   ├── search          Full-text influencer search
│   ├── ai/summary      Groq summary generation + cache
│   ├── ai/score        Groq fit scoring + cache
│   ├── campaigns       CRUD for campaigns
│   ├── applications    Apply, list, auto-score on apply
│   ├── profile/        Influencer profile upsert
│   └── admin/          Scrape queue + feature flags
└── /lib/
    ├── supabase/       Browser + server clients
    ├── groq.ts         AI generation functions
    └── security.ts     Sanitisation, rate limiting, logging, flags

Supabase (Postgres)
├── influencers         Scraped Instagram data + AI summaries
├── influencer_profiles Self-entered profile data
├── marketer_profiles   Marketer account data
├── campaigns           Campaign listings
├── applications        Applications with email + note
├── ai_fit_scores       Cached fit scores per (influencer × campaign)
├── scrape_requests     Queue for unscraped influencer signups
├── feature_flags       AI kill switches
└── api_rate_limits     Rate limit counters (stateless)
```

---

## AI Cost Strategy

AI calls are expensive if uncontrolled. VIRA minimises costs at every layer:

- **Summaries** use `llama-3.3-70b` (~$0.001/generation) and are generated once per influencer, cached permanently in the DB. Second call onwards is free.
- **Fit scores** use `llama-3.1-8b` (~$0.0002/score) and are cached per `(influencer_id, md5(campaign_description))`. Same campaign run twice = zero cost.
- **Auto-scoring** fires once per application in the background, uses the cache when available.
- **Rate limiting** — 10 summary calls/min, 20 score calls/min per user, stored in Supabase (stateless, works across serverless instances).
- **Kill switches** — any AI feature can be disabled instantly via `/admin/flags` without a deploy. Changes take effect in ≤30 seconds.

---

## Security

- **Row-level security (RLS)** enabled on all tables — users can only read/write their own data
- **Input sanitisation** on every API route — XSS stripping, email validation, handle normalisation, length caps
- **Rate limiting** — per-user and per-IP, backed by Supabase (not in-memory)
- **Admin endpoints** protected by `ADMIN_SECRET` header check
- **Password reset** — Supabase-issued links, 1-hour expiry
- **Service role key** never exposed to the browser
- **Structured logging** — security events and AI calls always logged; verbose info suppressed in production

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key ([console.groq.com](https://console.groq.com))
- Vercel account (for deployment)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/vira-search.git
cd vira-search
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key
ADMIN_SECRET=your-admin-secret
ADMIN_EMAIL=your@email.com
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
RESEND_API_KEY=your-resend-key   # optional, for email notifications
```

### 3. Set up the database

Run these SQL files in Supabase SQL Editor **in order**:

```
supabase/01_schema.sql
supabase/02_seed_influencers.mjs   ← seed script, not SQL
supabase/03_scrape_requests.sql
supabase/04_add_contact_email.sql
supabase/05_production_hardening.sql
supabase/06_rate_limit_rpc.sql
```

Also run:
```sql
alter table campaigns add column if not exists notes text;
alter table applications add column if not exists applicant_note text;
```

### 4. Seed influencer data

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_KEY=your-service-role-key \
node supabase/02_seed_influencers.mjs
```

### 5. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local` to Vercel project settings
4. Deploy

After deploying, add your Vercel URL to Supabase → **Authentication → URL Configuration → Redirect URLs**:
```
https://your-app.vercel.app/**
```

Also update `NEXT_PUBLIC_APP_DOMAIN` to your Vercel domain.

---

## Admin Pages

| Page | URL |
|---|---|
| Scrape queue | `/admin/scrape-queue?secret=YOUR_ADMIN_SECRET` |
| Feature flags / AI kill switches | `/admin/flags?secret=YOUR_ADMIN_SECRET` |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    Landing page
│   ├── search/                     Influencer search
│   ├── campaigns/                  Public campaign board + [id] detail
│   ├── dashboard/                  Marketer dashboard + campaigns/[id]
│   ├── profile/                    Influencer profile
│   ├── applications/               Influencer application tracker
│   ├── login/ signup/              Auth pages
│   ├── reset-password/             Password reset flow
│   ├── admin/                      Scrape queue + feature flags
│   └── api/                        All API routes
├── components/
│   ├── Nav.tsx                     Shared navigation (role-aware)
│   └── ErrorBoundary.tsx           React error boundary
└── lib/
    ├── supabase/client.ts          Browser Supabase client
    ├── supabase/server.ts          Server Supabase client + service client
    ├── groq.ts                     Groq AI functions
    └── security.ts                 Sanitisation, rate limiting, logging, flags
```

---

## Roadmap

- [ ] Apify integration for automated Instagram scraping
- [ ] pgvector semantic search ("find creators who feel like outdoor adventure")
- [ ] In-app notifications when application status changes
- [ ] Multi-user marketer teams
- [ ] Analytics dashboard (views, application conversion rates)
- [ ] Expanded influencer database beyond Melbourne food

---

## Built by

**Meidelline Surya** — Computer Science student, Melbourne.

Built as a real startup project, not a tutorial. Designed, architected, and shipped end-to-end.

---

## License

MIT