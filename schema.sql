-- ==============================================================================
-- POSTGRESQL DATABASE SCHEMA: YAMAHA EXPANSION CONVERSION SYSTEM
-- ==============================================================================

-- 1. Users Table (Google OAuth and Telegram Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Authentication Providers
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'GUEST', -- 'GOOGLE', 'TELEGRAM', 'LOCAL'
    google_id VARCHAR(255) UNIQUE,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    
    -- Quotas & Subscription
    tier VARCHAR(50) NOT NULL DEFAULT 'FREE', -- 'FREE', 'PRO', 'ENTERPRISE'
    daily_conversion_count INT DEFAULT 0,
    daily_conversion_limit INT DEFAULT 20,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for Telegram and Google lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. Conversion Jobs Table
CREATE TABLE IF NOT EXISTS conversion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Input File Metadata
    original_filename VARCHAR(255) NOT NULL,
    original_size_bytes BIGINT NOT NULL,
    original_format VARCHAR(20) NOT NULL, -- 'PPI', 'CPI'
    is_protected BOOLEAN DEFAULT FALSE,
    file_sha256 VARCHAR(64) NOT NULL,
    
    -- Target & Output
    target_format VARCHAR(20) NOT NULL, -- 'PPF', 'YEP'
    output_filename VARCHAR(255),
    output_size_bytes BIGINT,
    storage_s3_key TEXT,
    
    -- Processing Status
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    progress_percent INT DEFAULT 0,
    current_stage VARCHAR(150),
    error_message TEXT,
    
    -- Technical Telemetry
    detected_signature VARCHAR(10),
    pack_name VARCHAR(255),
    target_hardware VARCHAR(100),
    voices_count INT DEFAULT 0,
    styles_count INT DEFAULT 0,
    waves_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    download_expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON conversion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON conversion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON conversion_jobs(created_at DESC);

-- 3. System Conversion Metrics (Daily Aggregates for Dashboard)
CREATE TABLE IF NOT EXISTS conversion_daily_metrics (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    total_uploaded INT DEFAULT 0,
    total_converted INT DEFAULT 0,
    total_successful INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    total_bytes_processed BIGINT DEFAULT 0
);
