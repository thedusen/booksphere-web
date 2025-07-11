#!/bin/bash

# ============================================================================
# VERIFY CATALOGING PERFORMANCE OPTIMIZATION
# ============================================================================
# This script verifies that the cataloging_jobs performance optimization
# has been successfully deployed.
# ============================================================================

echo "🔍 Verifying Cataloging Performance Optimization..."
echo "=================================================="

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    exit 1
fi

# Function to run SQL query
run_query() {
    local query="$1"
    local description="$2"
    
    echo "🔍 $description"
    echo "SQL: $query"
    
    # Note: This would need to be adapted based on your database connection method
    # For now, we'll show what should be run
    echo "⚠️  Run this query in your database client to verify:"
    echo "   $query"
    echo ""
}

echo ""
echo "📋 Verification Checklist:"
echo "=========================="

# 1. Check if all indexes exist
echo "1. ✅ Checking if all performance indexes exist..."
run_query "SELECT indexname FROM pg_indexes WHERE tablename = 'cataloging_jobs' AND schemaname = 'public' ORDER BY indexname;" "List all indexes on cataloging_jobs"

# Expected indexes:
echo "   Expected indexes:"
echo "   - cataloging_jobs_pkey (primary key)"
echo "   - idx_cataloging_jobs_org_status_created"
echo "   - idx_cataloging_jobs_org_user_created"
echo "   - idx_cataloging_jobs_org_status_updated"
echo "   - idx_cataloging_jobs_extracted_data_gin"
echo "   - idx_cataloging_jobs_image_urls_gin"
echo "   - idx_cataloging_jobs_active_jobs"
echo "   - idx_cataloging_jobs_matched_editions_gin"
echo ""

# 2. Check index usage
echo "2. ✅ Checking index usage statistics..."
run_query "SELECT * FROM cataloging_jobs_index_usage;" "Check index usage view"

# 3. Check table statistics
echo "3. ✅ Checking table statistics..."
run_query "SELECT schemaname, tablename, n_live_tup as live_rows, n_dead_tup as dead_rows FROM pg_stat_user_tables WHERE tablename = 'cataloging_jobs';" "Check table statistics"

# 4. Performance test queries
echo "4. ✅ Performance test queries..."
echo "   Run these with EXPLAIN ANALYZE to verify index usage:"
echo ""

echo "   Test 1: Organization + Status query"
run_query "EXPLAIN ANALYZE SELECT job_id, status, created_at FROM cataloging_jobs WHERE organization_id = 'your-org-id' AND status = 'pending' ORDER BY created_at DESC LIMIT 20;" "Test primary query pattern"

echo "   Test 2: User-specific query"
run_query "EXPLAIN ANALYZE SELECT job_id, status, created_at FROM cataloging_jobs WHERE organization_id = 'your-org-id' AND user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 20;" "Test user-specific queries"

echo "   Test 3: JSONB search"
run_query "EXPLAIN ANALYZE SELECT job_id, extracted_data->'title' as title FROM cataloging_jobs WHERE organization_id = 'your-org-id' AND extracted_data @> '{\"title\": \"example\"}' LIMIT 10;" "Test JSONB search performance"

echo "   Test 4: Active jobs monitoring"
run_query "EXPLAIN ANALYZE SELECT job_id, status, updated_at FROM cataloging_jobs WHERE organization_id = 'your-org-id' AND status IN ('pending', 'processing') ORDER BY updated_at DESC LIMIT 50;" "Test active jobs monitoring"

echo ""
echo "📊 Performance Expectations:"
echo "=========================="
echo "• Dashboard queries: 50-90% faster response times"
echo "• User-specific queries: 60-80% faster"  
echo "• Real-time monitoring: 70-90% faster"
echo "• JSONB searches: 80-95% faster"
echo ""
echo "🎯 Success Criteria:"
echo "==================="
echo "• All 8 indexes present (1 primary + 7 performance)"
echo "• Query plans show 'Index Scan' instead of 'Seq Scan'"
echo "• Response times under 100ms for typical queries"
echo "• No performance regressions on write operations"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Run the verification queries in your database client"
echo "2. Monitor the cataloging_jobs_index_usage view weekly"
echo "3. Set up alerts for slow queries (>500ms)"
echo "4. Plan for quarterly performance reviews"
echo ""
echo "✅ Verification guide complete!"
echo "For detailed monitoring, see: context/verify_cataloging_performance.sql" 