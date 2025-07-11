-- ============================================================================
-- CATALOGING JOBS PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Created: 2025-01-15
-- Purpose: Critical performance indexes for cataloging_jobs table
-- 
-- This migration creates strategic indexes to optimize the most common query
-- patterns in the cataloging workflow system.
-- ============================================================================

-- 1. ORGANIZATION + STATUS + CREATED_AT (Most Critical)
-- ===================================================
-- Covers: List jobs by organization and status, ordered by creation time
-- Query: SELECT * FROM cataloging_jobs WHERE organization_id = $1 AND status = $2 ORDER BY created_at DESC
-- Usage: Dashboard views, status filtering, pagination
CREATE INDEX CONCURRENTLY idx_cataloging_jobs_org_status_created 
ON cataloging_jobs (organization_id, status, created_at DESC);

-- 2. ORGANIZATION + USER + CREATED_AT (User-Specific)  
-- ================================================
-- Covers: User-specific job queries with time ordering
-- Query: SELECT * FROM cataloging_jobs WHERE organization_id = $1 AND user_id = $2 ORDER BY created_at DESC
-- Usage: User dashboards, personal job history
CREATE INDEX CONCURRENTLY idx_cataloging_jobs_org_user_created 
ON cataloging_jobs (organization_id, user_id, created_at DESC);

-- 3. ORGANIZATION + STATUS + UPDATED_AT (Real-time Updates)
-- ======================================================
-- Covers: Real-time monitoring of active jobs
-- Query: SELECT * FROM cataloging_jobs WHERE organization_id = $1 AND status IN ('pending', 'processing') ORDER BY updated_at DESC
-- Usage: Real-time dashboards, monitoring systems
CREATE INDEX CONCURRENTLY idx_cataloging_jobs_org_status_updated 
ON cataloging_jobs (organization_id, status, updated_at DESC);

-- 4. EXTRACTED_DATA JSONB SEARCH (Content Queries)
-- ==============================================
-- Covers: Searching within extracted book data
-- Query: SELECT * FROM cataloging_jobs WHERE organization_id = $1 AND extracted_data @> '{"title": "book"}'
-- Usage: Content search, data analysis, duplicate detection
CREATE INDEX CONCURRENTLY idx_cataloging_jobs_extracted_data_gin 
ON cataloging_jobs USING GIN (extracted_data);

-- 5. IMAGE_URLS JSONB SEARCH (Image Management)
-- ==========================================
-- Covers: Searching within image metadata
-- Query: SELECT * FROM cataloging_jobs WHERE image_urls @> '{"url": "path"}'
-- Usage: Image management, storage optimization
CREATE INDEX CONCURRENTLY idx_cataloging_jobs_image_urls_gin 
ON cataloging_jobs USING GIN (image_urls);

-- 6. PARTIAL INDEX FOR ACTIVE JOBS (Storage Optimization)
-- ====================================================
-- Covers: Only index active jobs for monitoring queries
-- Reduces index size for completed/failed jobs
CREATE INDEX CONCURRENTLY idx_cataloging_jobs_active_jobs 
ON cataloging_jobs (organization_id, updated_at DESC) 
WHERE status IN ('pending', 'processing');

-- 7. MATCHED_EDITION_IDS ARRAY SEARCH (Book Matching)
-- =================================================
-- Covers: Finding jobs that matched specific editions
-- Query: SELECT * FROM cataloging_jobs WHERE $1 = ANY(matched_edition_ids)
-- Usage: Edition analytics, matching system debugging
CREATE INDEX CONCURRENTLY idx_cataloging_jobs_matched_editions_gin 
ON cataloging_jobs USING GIN (matched_edition_ids);

-- ============================================================================
-- INDEX USAGE MONITORING SETUP
-- ============================================================================

-- Create a view for easy index monitoring
CREATE OR REPLACE VIEW cataloging_jobs_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes 
WHERE tablename = 'cataloging_jobs'
ORDER BY idx_scan DESC;

-- Grant access to the monitoring view
GRANT SELECT ON cataloging_jobs_index_usage TO authenticated;

-- ============================================================================
-- PERFORMANCE VERIFICATION QUERIES
-- ============================================================================

-- Test query performance with EXPLAIN ANALYZE
-- Run these after deployment to verify index usage:

/*
-- Query 1: Organization + Status filtering
EXPLAIN ANALYZE 
SELECT job_id, status, created_at 
FROM cataloging_jobs 
WHERE organization_id = 'your-org-id' 
AND status = 'pending' 
ORDER BY created_at DESC 
LIMIT 20;

-- Query 2: User-specific queries  
EXPLAIN ANALYZE
SELECT job_id, status, created_at
FROM cataloging_jobs
WHERE organization_id = 'your-org-id'
AND user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 20;

-- Query 3: JSONB content search
EXPLAIN ANALYZE
SELECT job_id, extracted_data->'title' as title
FROM cataloging_jobs
WHERE organization_id = 'your-org-id'
AND extracted_data @> '{"title": "example"}'
LIMIT 10;

-- Query 4: Active jobs monitoring
EXPLAIN ANALYZE
SELECT job_id, status, updated_at
FROM cataloging_jobs
WHERE organization_id = 'your-org-id'
AND status IN ('pending', 'processing')
ORDER BY updated_at DESC
LIMIT 50;
*/