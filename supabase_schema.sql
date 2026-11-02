-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA: YAMAHA EXPANSION CONVERSION SYSTEM
-- ==============================================================================
-- Run this script directly in your Supabase Project -> SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/_/sql

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    username VARCHAR(100),
    avatar TEXT,
    provider VARCHAR(50) NOT NULL DEFAULT 'GUEST', -- 'GOOGLE', 'TELEGRAM', 'CREDENTIALS', 'GUEST'
    role VARCHAR(20) NOT NULL DEFAULT 'USER',       -- 'ADMIN', 'USER'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',   -- 'ACTIVE', 'SUSPENDED'
    conversions_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups by email or username
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_provider ON public.users(provider);

-- 2. Create Conversion Jobs Table
CREATE TABLE IF NOT EXISTS public.conversion_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    
    -- Original package attributes
    original_filename VARCHAR(255) NOT NULL,
    original_size_bytes BIGINT NOT NULL DEFAULT 0,
    original_format VARCHAR(20) NOT NULL DEFAULT 'PPI',
    
    -- Target package output
    target_format VARCHAR(20) NOT NULL DEFAULT 'PPF',
    output_filename VARCHAR(255),
    download_url TEXT,
    
    -- Job status & progress
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    progress_percent INT DEFAULT 0,
    current_stage VARCHAR(255),
    error_message TEXT,
    
    -- Yamaha sound telemetry
    detected_signature VARCHAR(20),
    pack_name VARCHAR(255),
    target_hardware VARCHAR(150),
    voices_count INT DEFAULT 0,
    styles_count INT DEFAULT 0,
    waves_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.conversion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.conversion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.conversion_jobs(created_at DESC);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public & authenticated read/write access via API (or refine for user-only access)
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Users" ON public.users FOR ALL USING (true);

CREATE POLICY "Public Read Jobs" ON public.conversion_jobs FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Jobs" ON public.conversion_jobs FOR ALL USING (true);

-- 4. Pre-seed Default System Accounts
INSERT INTO public.users (id, name, email, username, avatar, provider, role, status, conversions_count)
VALUES 
    ('usr_admin_01', 'Yamaha Master Admin', 'admin@yamaha-studio.com', 'yamaha_admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', 'CREDENTIALS', 'ADMIN', 'ACTIVE', 42),
    ('usr_artist_02', 'Alex Thorne (Expansion Designer)', 'artist@yamaha-studio.com', 'alex_thorne', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', 'GOOGLE', 'USER', 'ACTIVE', 18),
    ('usr_tg_88776655', 'Yamaha Keyboardist', 'keyboardist@telegram.org', 'yamaha_synth_pro', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', 'TELEGRAM', 'USER', 'ACTIVE', 7)
ON CONFLICT (id) DO NOTHING;
