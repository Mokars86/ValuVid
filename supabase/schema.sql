-- ============================================================
-- ValuVid Supabase Database Schema
-- Run this script in the Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Videos Table (Feed & Creation)
CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    caption TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'trending',
    hashtags TEXT[] DEFAULT '{}',
    creator_id TEXT,
    creator_data JSONB,
    stats JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "views": 1, "tipsTotalGHS": 0, "tipsCount": 0}',
    audio_track JSONB DEFAULT '{"title": "Original Sound", "artist": "Creator"}',
    is_pay_per_unlock BOOLEAN DEFAULT FALSE,
    unlock_price_ghs NUMERIC(10,2) DEFAULT 0.00,
    is_ai_content BOOLEAN DEFAULT FALSE,
    ai_disclosure_type TEXT DEFAULT 'none',
    ai_tools_used TEXT[] DEFAULT '{}',
    valu_split JSONB,
    community_goal JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Allow Public Read/Write for MVP
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Public Insert Videos" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Videos" ON public.videos FOR UPDATE USING (true);

-- 3. Transactions Table (Tips, Cashouts, Top-Ups)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    amount_ghs NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'completed',
    method TEXT DEFAULT 'MTN Mobile Money',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert Transactions" ON public.transactions FOR INSERT WITH CHECK (true);

-- 4. Bounties Table (Brand Sponsored Challenges)
CREATE TABLE IF NOT EXISTS public.bounties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sponsor TEXT NOT NULL,
    sponsor_logo TEXT,
    reward_pool_ghs NUMERIC(10,2) NOT NULL,
    reward_pool_usd NUMERIC(10,2) NOT NULL,
    participants_count INT DEFAULT 0,
    submissions_count INT DEFAULT 0,
    days_remaining INT DEFAULT 14,
    category TEXT DEFAULT 'tech',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Bounties" ON public.bounties FOR SELECT USING (true);
CREATE POLICY "Public Insert Bounties" ON public.bounties FOR INSERT WITH CHECK (true);

-- 5. Storage Setup Note:
-- Go to Supabase Dashboard -> Storage -> "New Bucket"
-- Name: "ValuVid App" (or "valuvid-app")
-- Make sure to toggle "Public bucket" ON so uploaded videos & photos can be streamed!
