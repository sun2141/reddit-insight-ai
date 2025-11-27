-- ===================================================
-- Hacker News Insight AI - Database Schema
-- ===================================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== 1. Projects Table =====
-- Stores analysis project information
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT DEFAULT 'hackernews',
  feed_type TEXT,
  story_count INTEGER,
  min_score INTEGER DEFAULT 0,
  min_comments INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ===== 2. Analysis Results Table =====
-- Stores Hacker News data and AI analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raw_data JSONB,
  summaries JSONB,
  insight_report JSONB,
  blog_draft TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analysis_results_project_id ON analysis_results(project_id);

-- ===== 3. WordPress Posts Table =====
-- Tracks published WordPress posts
CREATE TABLE IF NOT EXISTS wordpress_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  wp_post_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_project_id ON wordpress_posts(project_id);

-- ===== 4. Auto-update updated_at trigger =====
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== 5. Row Level Security (RLS) =====
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service_role (backend)
-- For now, allow all for anon role too (you can restrict this later)
CREATE POLICY "Allow all for service role - projects" ON projects
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role - analysis_results" ON analysis_results
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role - wordpress_posts" ON wordpress_posts
  FOR ALL USING (true);

-- ===== 6. Helpful queries (for testing) =====
-- Uncomment to test after creating tables

-- View all projects
-- SELECT * FROM projects ORDER BY created_at DESC;

-- View project with analysis results
-- SELECT
--   p.*,
--   ar.summaries,
--   ar.insight_report
-- FROM projects p
-- LEFT JOIN analysis_results ar ON p.id = ar.project_id
-- ORDER BY p.created_at DESC;

-- Count projects by status
-- SELECT status, COUNT(*) FROM projects GROUP BY status;
