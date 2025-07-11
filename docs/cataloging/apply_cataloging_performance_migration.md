# Apply Cataloging Performance Migration

## Quick Start

### 1. Apply the Migration

```bash
# Navigate to your project directory
cd /Users/mitch/Documents/Projects/booksphere-web

# Apply the migration via Supabase CLI
supabase db push

# Or apply directly via SQL (if using Supabase dashboard)
# Copy the contents of: supabase/migrations/20250115_optimize_cataloging_jobs_performance.sql
# And run it in the SQL editor
```

### 2. Verify Index Creation

```sql
-- Check if all indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'cataloging_jobs' 
AND schemaname = 'public'
ORDER BY indexname;

-- Expected indexes:
-- idx_cataloging_jobs_org_status_created
-- idx_cataloging_jobs_org_user_created  
-- idx_cataloging_jobs_org_status_updated
-- idx_cataloging_jobs_extracted_data_gin
-- idx_cataloging_jobs_image_urls_gin
-- idx_cataloging_jobs_active_jobs
-- idx_cataloging_jobs_matched_editions_gin
```

### 3. Test Query Performance

```sql
-- Test the most critical query pattern
EXPLAIN ANALYZE 
SELECT job_id, status, created_at 
FROM cataloging_jobs 
WHERE organization_id = 'test-org-id' 
AND status = 'pending' 
ORDER BY created_at DESC 
LIMIT 20;

-- Look for "Index Scan" in the execution plan
-- Should use: idx_cataloging_jobs_org_status_created
```

### 4. Monitor Index Usage

```sql
-- Check the monitoring view
SELECT * FROM cataloging_jobs_index_usage;

-- This will show usage statistics for all indexes
-- Initially, usage will be low until queries start running
```

## Post-Migration Checklist

- [ ] All 7 indexes created successfully
- [ ] No errors in migration log
- [ ] Query performance improved (test with actual data)
- [ ] Monitoring view accessible
- [ ] Documentation updated

## Rollback Plan (if needed)

```sql
-- If you need to rollback the indexes:
DROP INDEX CONCURRENTLY idx_cataloging_jobs_org_status_created;
DROP INDEX CONCURRENTLY idx_cataloging_jobs_org_user_created;
DROP INDEX CONCURRENTLY idx_cataloging_jobs_org_status_updated;
DROP INDEX CONCURRENTLY idx_cataloging_jobs_extracted_data_gin;
DROP INDEX CONCURRENTLY idx_cataloging_jobs_image_urls_gin;
DROP INDEX CONCURRENTLY idx_cataloging_jobs_active_jobs;
DROP INDEX CONCURRENTLY idx_cataloging_jobs_matched_editions_gin;
DROP VIEW cataloging_jobs_index_usage;
```

## Expected Impact

### Performance Improvements
- **Dashboard queries**: 50-90% faster response times
- **User-specific queries**: 60-80% faster
- **Real-time monitoring**: 70-90% faster
- **JSONB searches**: 80-95% faster

### Storage Impact
- **Index overhead**: Approximately 20-40% of table size
- **Current table size**: 64 kB (minimal impact)
- **Future growth**: Plan for 2x table size in indexes

### Operational Benefits
- Reduced database load
- Better user experience
- Improved system scalability
- Enhanced monitoring capabilities

## Next Steps

1. **Load Test**: Run realistic load tests with actual data
2. **Monitor**: Set up alerts for index usage and query performance
3. **Optimize**: Fine-tune queries to leverage new indexes
4. **Scale**: Plan for future growth and partitioning strategy

## Support

If you encounter issues:
1. Check the migration log for errors
2. Verify your PostgreSQL version supports all features
3. Ensure sufficient disk space for index creation
4. Review the maintenance guide for troubleshooting steps