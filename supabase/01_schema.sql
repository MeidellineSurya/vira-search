-- ============================================================
-- VIRA - Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- INFLUENCERS
-- Your scraped Instagram data lives here.
-- ai_summary is populated on demand via Groq.
-- ============================================================
create table if not exists influencers (
  id                      uuid primary key default gen_random_uuid(),
  profile_name            text not null unique,
  bio                     text,
  industry                text default 'Food',
  average_comments        numeric,
  average_likes           numeric,
  engagement_rate         numeric,
  followers_count         integer,
  instagram_url           text,
  -- AI summary (generated on demand, cached)
  ai_summary              text,
  ai_summary_generated_at timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Full-text search index across profile_name, bio, industry
create index if not exists influencers_fts_idx
  on influencers
  using gin(to_tsvector('english', coalesce(profile_name, '') || ' ' || coalesce(bio, '') || ' ' || coalesce(industry, '')));

-- ============================================================
-- AI FIT SCORES CACHE
-- Stores per-(influencer, campaign_description_hash) scores.
-- Avoids re-calling Groq for identical combinations.
-- ============================================================
create table if not exists ai_fit_scores (
  id                   uuid primary key default gen_random_uuid(),
  influencer_id        uuid not null references influencers(id) on delete cascade,
  campaign_hash        text not null,          -- md5 of the campaign description
  campaign_description text not null,
  fit_score            integer not null check (fit_score between 0 and 100),
  fit_summary          text,
  match_reasons        text[],
  created_at           timestamptz default now(),
  -- One score per influencer+campaign combo
  unique (influencer_id, campaign_hash)
);

create index if not exists ai_fit_scores_influencer_idx on ai_fit_scores(influencer_id);
create index if not exists ai_fit_scores_hash_idx on ai_fit_scores(campaign_hash);

-- ============================================================
-- USERS (extends Supabase Auth)
-- role = 'marketer' | 'influencer'
-- ============================================================
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('marketer', 'influencer')),
  created_at timestamptz default now()
);

-- ============================================================
-- MARKETER PROFILES
-- ============================================================
create table if not exists marketer_profiles (
  id           uuid primary key references profiles(id) on delete cascade,
  company_name text,
  role_title   text,
  website      text,
  instagram    text,
  niche_tags   text[],
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- INFLUENCER PROFILES (self-entered, merged with scraped data)
-- ============================================================
create table if not exists influencer_profiles (
  id              uuid primary key references profiles(id) on delete cascade,
  influencer_id   uuid references influencers(id),   -- links to scraped record
  ig_handle       text,
  niche_tags      text[],
  short_bio       text,
  audience_location text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
create table if not exists campaigns (
  id                  uuid primary key default gen_random_uuid(),
  marketer_id         uuid not null references marketer_profiles(id) on delete cascade,
  title               text not null,
  description         text,
  content_type_tags   text[],
  niche_tags          text[],
  budget_range        text,
  timeline            text,
  ideal_follower_min  integer,
  ideal_follower_max  integer,
  status              text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists campaigns_status_idx on campaigns(status);
create index if not exists campaigns_marketer_idx on campaigns(marketer_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================
create table if not exists applications (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references campaigns(id) on delete cascade,
  influencer_id  uuid not null references influencer_profiles(id) on delete cascade,
  ai_fit_score   integer,
  ai_fit_summary text,
  match_reasons  text[],
  status         text not null default 'pending' check (status in ('pending', 'viewed', 'selected', 'passed')),
  applied_at     timestamptz default now(),
  unique (campaign_id, influencer_id)
);

create index if not exists applications_campaign_idx on applications(campaign_id);
create index if not exists applications_influencer_idx on applications(influencer_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Influencers table: public read, no public write
alter table influencers enable row level security;
create policy "Influencers are publicly readable"
  on influencers for select using (true);
create policy "Service role can insert/update influencers"
  on influencers for all using (auth.role() = 'service_role');

-- AI fit scores: only authenticated users can read, service role writes
alter table ai_fit_scores enable row level security;
create policy "Authenticated users can read fit scores"
  on ai_fit_scores for select using (auth.role() = 'authenticated');
create policy "Service role can insert fit scores"
  on ai_fit_scores for insert with check (auth.role() = 'service_role');

-- Profiles: users see their own
alter table profiles enable row level security;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Campaigns: public read for active, marketers manage their own
alter table campaigns enable row level security;
create policy "Active campaigns are public"
  on campaigns for select using (status = 'active');
create policy "Marketers manage own campaigns"
  on campaigns for all using (
    auth.uid() = marketer_id
  );

-- Applications: influencers see own, marketers see their campaign's
alter table applications enable row level security;
create policy "Influencers see own applications"
  on applications for select using (
    influencer_id in (
      select id from influencer_profiles where id = auth.uid()
    )
  );
create policy "Marketers see applications to their campaigns"
  on applications for select using (
    campaign_id in (
      select id from campaigns where marketer_id = auth.uid()
    )
  );
create policy "Influencers can apply"
  on applications for insert with check (
    influencer_id in (
      select id from influencer_profiles where id = auth.uid()
    )
  );
create policy "Marketers can update application status"
  on applications for update using (
    campaign_id in (
      select id from campaigns where marketer_id = auth.uid()
    )
  );