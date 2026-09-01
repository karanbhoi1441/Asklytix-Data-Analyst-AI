-- =============================================================================
-- Supabase Schema for AskLytix Data Analyst Platform
-- Execute this script directly in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on user email for fast authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Datasets Table
CREATE TABLE IF NOT EXISTS public.datasets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    row_count INTEGER NOT NULL DEFAULT 0,
    column_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ready',
    schema_metadata JSONB,
    quality_summary JSONB,
    active_version_id VARCHAR(36),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on datasets user_id
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON public.datasets(user_id);

-- 3. Dataset Versions Table
CREATE TABLE IF NOT EXISTS public.dataset_versions (
    id VARCHAR(36) PRIMARY KEY,
    dataset_id VARCHAR(36) NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    version_type VARCHAR(50) NOT NULL DEFAULT 'original',
    file_path VARCHAR(512) NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    row_count INTEGER NOT NULL DEFAULT 0,
    column_count INTEGER NOT NULL DEFAULT 0,
    quality_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    quality_metrics JSONB,
    cleaning_operations JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on dataset_versions dataset_id
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON public.dataset_versions(dataset_id);

-- 4. Saved Visualizations Table
CREATE TABLE IF NOT EXISTS public.saved_visualizations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dataset_id VARCHAR(36) REFERENCES public.datasets(id) ON DELETE SET NULL,
    user_question TEXT NOT NULL,
    chart_type VARCHAR(50) NOT NULL DEFAULT 'bar',
    title VARCHAR(255) NOT NULL,
    columns_used JSONB,
    sandbox_execution_id VARCHAR(64),
    image_url VARCHAR(512) NOT NULL,
    base64_image TEXT,
    generated_code TEXT,
    explanation TEXT,
    execution_time_ms DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    position INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for saved_visualizations
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_user_id ON public.saved_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_dataset_id ON public.saved_visualizations(dataset_id);

-- =============================================================================
-- Row Level Security (RLS) Configuration
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_visualizations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to all tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_users') THEN
        CREATE POLICY service_role_all_users ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_datasets') THEN
        CREATE POLICY service_role_all_datasets ON public.datasets FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dataset_versions') THEN
        CREATE POLICY service_role_all_dataset_versions ON public.dataset_versions FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_saved_visualizations') THEN
        CREATE POLICY service_role_all_saved_visualizations ON public.saved_visualizations FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
