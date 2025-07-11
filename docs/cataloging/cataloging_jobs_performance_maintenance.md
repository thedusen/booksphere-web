# Cataloging Jobs Performance Maintenance Guide

## Overview

This document provides ongoing maintenance strategies for the `cataloging_jobs` table performance optimization implemented in migration `20250115_optimize_cataloging_jobs_performance.sql`.

## Index Architecture

### Primary Indexes Created

1. **`idx_cataloging_jobs_org_status_created`** - Organization + Status + Created Time
   - **Purpose**: Most critical query pattern for dashboard views
   - **Covers**: Status filtering with time ordering per organization
   - **Expected Usage**: HIGH - Primary dashboard queries

2. **`idx_cataloging_jobs_org_user_created`** - Organization + User + Created Time  
   - **Purpose**: User-specific job queries
   - **Covers**: Personal job history and user dashboards
   - **Expected Usage**: MODERATE - User-specific views

3. **`idx_cataloging_jobs_org_status_updated`** - Organization + Status + Updated Time
   - **Purpose**: Real-time monitoring queries
   - **Covers**: Active job monitoring and status updates
   - **Expected Usage**: HIGH - Real-time dashboards

4. **`idx_cataloging_jobs_extracted_data_gin`** - JSONB GIN on extracted_data
   - **Purpose**: Content search within extracted book data
   - **Covers**: Full-text search and data analysis
   - **Expected Usage**: MODERATE - Search functionality

5. **`idx_cataloging_jobs_image_urls_gin`** - JSONB GIN on image_urls
   - **Purpose**: Image metadata queries
   - **Covers**: Image management and storage optimization
   - **Expected Usage**: LOW - Administrative tasks

6. **`idx_cataloging_jobs_active_jobs`** - Partial index for active jobs
   - **Purpose**: Storage optimization for monitoring queries
   - **Covers**: Only pending/processing jobs
   - **Expected Usage**: HIGH - Real-time monitoring

7. **`idx_cataloging_jobs_matched_editions_gin`** - Array GIN on matched_edition_ids
   - **Purpose**: Book matching analytics
   - **Covers**: Edition matching analysis
   - **Expected Usage**: LOW - Analytics queries

## Monitoring Strategy

### Real-time Monitoring

```sql
-- Check current index usage
SELECT * FROM cataloging_jobs_index_usage;

-- Monitor query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements 
WHERE query LIKE '%cataloging_jobs%'
ORDER BY total_time DESC;
```

### Weekly Health Check

```sql
-- Check index bloat
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_size_pretty(pg_total_relation_size(indexrelid)) as total_size
FROM pg_stat_user_indexes
WHERE tablename = 'cataloging_jobs'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check for unused indexes
SELECT 
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'cataloging_jobs'
AND idx_scan < 100;
```

## Maintenance Windows

### Monthly Maintenance (Low-Traffic Hours)

```sql
-- REINDEX to reduce bloat (if needed)
REINDEX INDEX CONCURRENTLY idx_cataloging_jobs_org_status_created;
REINDEX INDEX CONCURRENTLY idx_cataloging_jobs_org_user_created;
REINDEX INDEX CONCURRENTLY idx_cataloging_jobs_org_status_updated;

-- Update table statistics
ANALYZE cataloging_jobs;
```

### Quarterly Review

1. **Performance Analysis**
   - Review query execution plans
   - Check for new query patterns
   - Analyze index usage statistics

2. **Index Optimization**
   - Consider dropping unused indexes
   - Evaluate need for new indexes
   - Review partial index effectiveness

3. **Capacity Planning**
   - Monitor storage growth
   - Check index size trends
   - Plan for scaling needs

## Performance Benchmarks

### Expected Query Performance

| Query Type | Expected Response Time | Index Used |
|------------|----------------------|------------|
| Organization + Status | < 50ms | `idx_cataloging_jobs_org_status_created` |
| User-specific queries | < 100ms | `idx_cataloging_jobs_org_user_created` |
| Real-time monitoring | < 25ms | `idx_cataloging_jobs_active_jobs` |
| JSONB content search | < 200ms | `idx_cataloging_jobs_extracted_data_gin` |

### Performance Alerts

Set up monitoring alerts for:
- Query response time > 500ms
- Index scan ratio < 80%
- Table locks > 1 second
- Index bloat > 50%

## Scaling Considerations

### High-Volume Scenarios

When the table grows beyond 1M rows:

1. **Partition Strategy**
   - Consider partitioning by `created_at` (monthly)
   - Maintain indexes on each partition
   - Update queries to include partition keys

2. **Archive Strategy**
   - Move completed jobs older than 6 months to archive table
   - Maintain active job indexes for better performance
   - Create separate indexes for historical analysis

3. **Connection Pooling**
   - Monitor connection usage during index operations
   - Use connection pooling for high-concurrency scenarios
   - Consider read replicas for analytics queries

## Troubleshooting

### Common Issues

1. **Slow Query Performance**
   - Check if correct index is being used with `EXPLAIN ANALYZE`
   - Verify query patterns match index design
   - Check for missing `organization_id` in queries

2. **Index Bloat**
   - Monitor index size growth over time
   - Schedule regular REINDEX operations
   - Consider more frequent VACUUM operations

3. **Lock Contention**
   - Monitor for long-running queries
   - Use `CONCURRENTLY` for all index operations
   - Schedule maintenance during low-traffic periods

### Performance Regression

If query performance degrades:

1. **Immediate Actions**
   - Check `pg_stat_activity` for blocking queries
   - Review recent query pattern changes
   - Verify index usage with `EXPLAIN ANALYZE`

2. **Investigation**
   - Compare current vs. historical performance metrics
   - Check for new query patterns not covered by indexes
   - Analyze table statistics and index selectivity

3. **Resolution**
   - Create missing indexes if needed
   - Optimize queries to use existing indexes
   - Consider query rewrite for better index utilization

## Emergency Procedures

### Index Corruption

```sql
-- Check for index corruption
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0 AND idx_tup_read > 0;

-- Rebuild corrupted index
DROP INDEX CONCURRENTLY idx_corrupted_index;
CREATE INDEX CONCURRENTLY idx_corrupted_index ON cataloging_jobs (...);
```

### Performance Crisis

1. **Immediate Relief**
   - Identify and terminate long-running queries
   - Temporarily disable non-critical features
   - Scale up database resources if needed

2. **Short-term Fix**
   - Create emergency indexes for critical queries
   - Optimize most expensive queries
   - Increase connection limits if needed

3. **Long-term Solution**
   - Implement comprehensive monitoring
   - Review and optimize database configuration
   - Plan for capacity scaling

## Success Metrics

Track these KPIs to measure optimization success:

- **Query Performance**: 95th percentile response time < 200ms
- **Index Utilization**: > 80% of queries use indexes
- **System Load**: Database CPU < 70% during peak hours
- **Storage Efficiency**: Index size < 2x table size
- **Availability**: 99.9% uptime for catalog operations

## Review Schedule

- **Daily**: Monitor query performance and index usage
- **Weekly**: Review slow query log and index statistics
- **Monthly**: Perform maintenance operations and capacity planning
- **Quarterly**: Comprehensive performance review and optimization planning