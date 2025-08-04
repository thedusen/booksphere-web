-- ============================================================================
-- MIGRATION: create_outbox_monitoring_views
-- TIMESTAMP: 20250117100500
-- ============================================================================
-- Purpose: Create comprehensive monitoring views for outbox system health,
-- performance metrics, and alerting thresholds.
-- ============================================================================

-- ============================================================================
-- MAIN HEALTH METRICS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW public.outbox_health_metrics AS
WITH event_stats AS (
    SELECT
        COUNT(*) as total_events,
        COUNT(CASE WHEN delivered_at IS NULL THEN 1 END) as undelivered_events,
        COUNT(CASE WHEN delivery_attempts > 0 THEN 1 END) as retry_events,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as events_last_hour,
        MAX(CASE WHEN delivered_at IS NULL THEN created_at END) as oldest_undelivered,
        AVG(CASE WHEN delivered_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (delivered_at - created_at)) END) as avg_delivery_time_seconds
    FROM public.cataloging_event_outbox
    WHERE created_at > NOW() - INTERVAL '7 days'
),
dlq_stats AS (
    SELECT
        COUNT(*) as dlq_events,
        COUNT(CASE WHEN failed_at > NOW() - INTERVAL '1 hour' THEN 1 END) as dlq_events_last_hour
    FROM public.cataloging_event_outbox_dlq
    WHERE failed_at > NOW() - INTERVAL '7 days'
)
SELECT
    'undelivered_events' as metric, undelivered_events as value,
    'Events waiting for delivery (CRITICAL: alert if > 1000)' as description
    FROM event_stats
UNION ALL
SELECT
    'oldest_undelivered_age_seconds',
    COALESCE(EXTRACT(EPOCH FROM (NOW() - oldest_undelivered)), 0)::BIGINT,
    'Age of oldest undelivered event (CRITICAL: alert if > 300 seconds)'
    FROM event_stats
UNION ALL
SELECT
    'avg_delivery_time_seconds',
    COALESCE(avg_delivery_time_seconds, 0)::BIGINT,
    'Average delivery time (WARNING: alert if > 5 seconds)'
    FROM event_stats
UNION ALL
SELECT
    'dlq_events_last_hour', dlq_events_last_hour,
    'Events moved to DLQ in last hour (WARNING: alert if > 10)'
    FROM dlq_stats
UNION ALL
SELECT 'events_last_hour', events_last_hour, 'Event creation rate (last hour)' FROM event_stats
UNION ALL
SELECT 'retry_events', retry_events, 'Events that required retry attempts' FROM event_stats
UNION ALL
SELECT 'dlq_total_events', dlq_events, 'Total events in dead letter queue' FROM dlq_stats;


-- ============================================================================
-- ORGANIZATION-SPECIFIC METRICS
-- ============================================================================
CREATE OR REPLACE VIEW public.outbox_org_metrics AS
SELECT
    o.organization_id,
    COALESCE(org.name, 'Unknown Organization') as organization_name,
    COUNT(*) as total_events,
    COUNT(CASE WHEN o.delivered_at IS NULL THEN 1 END) as undelivered_events,
    COUNT(CASE WHEN o.delivery_attempts > 0 THEN 1 END) as retry_events,
    AVG(CASE WHEN o.delivered_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) END) as avg_delivery_time_seconds
FROM public.cataloging_event_outbox o
LEFT JOIN public.organizations org ON org.id = o.organization_id
WHERE o.created_at > NOW() - INTERVAL '24 hours'
GROUP BY o.organization_id, org.name
ORDER BY undelivered_events DESC, total_events DESC;


-- ============================================================================
-- CURSOR HEALTH MONITORING
-- ============================================================================
CREATE OR REPLACE VIEW public.outbox_cursor_health AS
SELECT
    c.processor_name,
    c.organization_id,
    COALESCE(org.name, 'Unknown Organization') as organization_name,
    c.last_processed_at,
    EXTRACT(EPOCH FROM (NOW() - c.last_processed_at)) as cursor_lag_seconds,
    (
        SELECT COUNT(*)
        FROM public.cataloging_event_outbox o
        WHERE o.organization_id = c.organization_id
          AND o.event_id > c.last_processed_event_id
          AND o.delivered_at IS NULL
    ) as events_behind_cursor
FROM public.cataloging_event_outbox_cursor c
LEFT JOIN public.organizations org ON org.id = c.organization_id
ORDER BY cursor_lag_seconds DESC;


-- ============================================================================
-- INDEX PERFORMANCE MONITORING
-- ============================================================================
CREATE OR REPLACE VIEW public.outbox_index_performance AS
SELECT
    s.schemaname,
    s.relname as table_name,
    s.indexrelname as index_name,
    s.idx_tup_read as reads_from_index,
    s.idx_tup_fetch as fetches_from_table,
    CASE
        WHEN s.idx_tup_fetch > 0 THEN
            ROUND((s.idx_tup_read::NUMERIC / s.idx_tup_fetch), 2)
        ELSE 0
    END as selectivity_ratio,
    s.idx_scan as scan_count,
    pg_size_pretty(pg_relation_size(s.indexrelid)) as index_size
FROM pg_stat_user_indexes s
WHERE s.relname LIKE '%outbox%'
ORDER BY s.idx_scan DESC;


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.outbox_health_metrics TO authenticated, service_role;
GRANT SELECT ON public.outbox_org_metrics TO authenticated, service_role;
GRANT SELECT ON public.outbox_cursor_health TO authenticated, service_role;
GRANT SELECT ON public.outbox_index_performance TO authenticated, service_role;

-- Add view documentation
COMMENT ON VIEW public.outbox_health_metrics IS 'Primary health dashboard for the outbox system, focused on key alerting metrics.';
COMMENT ON VIEW public.outbox_org_metrics IS 'Per-organization event processing metrics for multi-tenant monitoring.';
COMMENT ON VIEW public.outbox_cursor_health IS 'Monitors cursor lag and the number of unprocessed events behind each processor.';
COMMENT ON VIEW public.outbox_index_performance IS 'Tracks index usage and efficiency for outbox-related tables.'; 