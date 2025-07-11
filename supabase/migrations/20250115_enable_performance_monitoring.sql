-- Enable enhanced monitoring for cataloging system
-- This is safe to apply and non-breaking

-- Create monitoring function for cataloging performance
CREATE OR REPLACE FUNCTION get_cataloging_performance_metrics()
RETURNS TABLE (
    metric_name TEXT,
    metric_value BIGINT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'total_jobs'::TEXT,
        COALESCE((SELECT COUNT(*) FROM cataloging_jobs), 0)::BIGINT,
        'Total cataloging jobs in system'::TEXT
    UNION ALL
    SELECT 
        'active_jobs'::TEXT,
        COALESCE((SELECT COUNT(*) FROM cataloging_jobs WHERE status IN ('pending', 'processing')), 0)::BIGINT,
        'Jobs currently being processed'::TEXT
    UNION ALL
    SELECT 
        'completed_jobs'::TEXT,
        COALESCE((SELECT COUNT(*) FROM cataloging_jobs WHERE status = 'completed'), 0)::BIGINT,
        'Successfully completed jobs'::TEXT
    UNION ALL
    SELECT 
        'failed_jobs'::TEXT,
        COALESCE((SELECT COUNT(*) FROM cataloging_jobs WHERE status = 'failed'), 0)::BIGINT,
        'Jobs that failed processing'::TEXT
    UNION ALL
    SELECT 
        'index_scans'::TEXT,
        COALESCE((SELECT SUM(idx_scan) FROM pg_stat_user_indexes WHERE relname = 'cataloging_jobs'), 0)::BIGINT,
        'Total index scans on cataloging_jobs'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to monitoring function
GRANT EXECUTE ON FUNCTION get_cataloging_performance_metrics() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_cataloging_performance_metrics() IS 'Monitor cataloging system performance metrics and index usage'; 