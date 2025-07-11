-- ============================================================================
-- CATALOGING JOBS PERFORMANCE VERIFICATION
-- ============================================================================
-- Run this after deploying the performance optimization migration
-- to verify all indexes were created successfully and are working correctly
-- ============================================================================

-- 1. CHECK ALL INDEXES ON CATALOGING_JOBS TABLE
-- ===========================================
SELECT 
    '=== CATALOGING_JOBS INDEXES ===' as section,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'cataloging_jobs' 
AND schemaname = 'public'
ORDER BY indexname;

-- Expected Results: 8 indexes total
-- ✅ cataloging_jobs_pkey (primary key)
-- ✅ idx_cataloging_jobs_org_status_created
-- ✅ idx_cataloging_jobs_org_user_created  
-- ✅ idx_cataloging_jobs_org_status_updated
-- ✅ idx_cataloging_jobs_extracted_data_gin
-- ✅ idx_cataloging_jobs_image_urls_gin
-- ✅ idx_cataloging_jobs_active_jobs
-- ✅ idx_cataloging_jobs_matched_editions_gin

-- 2. CHECK INDEX USAGE STATISTICS
-- ===============================
SELECT 
    '=== INDEX USAGE STATISTICS ===' as section,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes 
WHERE tablename = 'cataloging_jobs'
ORDER BY idx_scan DESC;

-- 3. CHECK TABLE STATISTICS
-- ========================
SELECT 
    '=== TABLE STATISTICS ===' as section,
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename = 'cataloging_jobs';

-- 4. CHECK INDEX SIZES
-- ===================
SELECT 
    '=== INDEX SIZES ===' as section,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as size_bytes
FROM pg_stat_user_indexes 
WHERE tablename = 'cataloging_jobs'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 5. PERFORMANCE TEST QUERIES
-- ===========================
-- Run these with EXPLAIN ANALYZE to verify index usage
-- Replace 'your-org-id' and 'your-user-id' with actual values

/*
-- Test 1: Organization + Status query (should use idx_cataloging_jobs_org_status_created)
EXPLAIN ANALYZE 
SELECT job_id, status, created_at 
FROM cataloging_jobs 
WHERE organization_id = 'your-org-id' 
AND status = 'pending' 
ORDER BY created_at DESC 
LIMIT 20;

-- Test 2: User-specific query (should use idx_cataloging_jobs_org_user_created)
EXPLAIN ANALYZE
SELECT job_id, status, created_at
FROM cataloging_jobs
WHERE organization_id = 'your-org-id'
AND user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 20;

-- Test 3: JSONB search (should use idx_cataloging_jobs_extracted_data_gin)
EXPLAIN ANALYZE
SELECT job_id, extracted_data->'title' as title
FROM cataloging_jobs
WHERE organization_id = 'your-org-id'
AND extracted_data @> '{"title": "example"}'
LIMIT 10;

-- Test 4: Active jobs monitoring (should use idx_cataloging_jobs_active_jobs)
EXPLAIN ANALYZE
SELECT job_id, status, updated_at
FROM cataloging_jobs
WHERE organization_id = 'your-org-id'
AND status IN ('pending', 'processing')
ORDER BY updated_at DESC
LIMIT 50;
*/

-- 6. MONITORING VIEW CHECK
-- =======================
SELECT 
    '=== MONITORING VIEW ===' as section,
    EXISTS(
        SELECT 1 FROM pg_views 
        WHERE viewname = 'cataloging_jobs_index_usage'
    ) as monitoring_view_exists;

-- 7. SUMMARY REPORT
-- =================
SELECT 
    '=== DEPLOYMENT SUMMARY ===' as section,
    (SELECT count(*) FROM pg_indexes WHERE tablename = 'cataloging_jobs') as total_indexes,
    (SELECT count(*) FROM pg_indexes WHERE tablename = 'cataloging_jobs' AND indexname LIKE 'idx_cataloging_jobs_%') as new_indexes,
    (SELECT pg_size_pretty(pg_total_relation_size('cataloging_jobs'))) as total_table_size,
    (SELECT count(*) FROM pg_stat_user_indexes WHERE tablename = 'cataloging_jobs' AND idx_scan > 0) as active_indexes;

-- ============================================================================
-- EXPECTED RESULTS CHECKLIST
-- ============================================================================
-- ✅ 8 total indexes (1 primary key + 7 performance indexes)
-- ✅ All idx_cataloging_jobs_* indexes present
-- ✅ monitoring_view_exists = true
-- ✅ Performance test queries show index usage in EXPLAIN ANALYZE
-- ✅ No errors in deployment
-- ============================================================================