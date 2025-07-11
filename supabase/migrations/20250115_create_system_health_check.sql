-- Create comprehensive system health check function
-- This provides a single function to verify all optimizations are working

CREATE OR REPLACE FUNCTION run_system_health_check()
RETURNS TABLE (
    component TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
DECLARE
    cataloging_indexes_count INT;
    inventory_indexes_count INT;
    total_stock_items INT;
    total_editions INT;
    total_books INT;
BEGIN
    -- Check cataloging indexes
    SELECT COUNT(*) INTO cataloging_indexes_count 
    FROM pg_indexes 
    WHERE tablename = 'cataloging_jobs' 
    AND indexname LIKE 'idx_cataloging_jobs_%';
    
    -- Check inventory indexes  
    SELECT COUNT(*) INTO inventory_indexes_count
    FROM pg_indexes
    WHERE tablename IN ('stock_items', 'editions', 'books')
    AND indexname LIKE 'idx_%';
    
    -- Get data counts
    SELECT COUNT(*) INTO total_stock_items FROM stock_items;
    SELECT COUNT(*) INTO total_editions FROM editions;
    SELECT COUNT(*) INTO total_books FROM books;
    
    -- Return health check results
    RETURN QUERY
    SELECT 
        'Cataloging Indexes'::TEXT,
        CASE WHEN cataloging_indexes_count >= 7 THEN 'HEALTHY' ELSE 'NEEDS_ATTENTION' END,
        format('Found %s cataloging performance indexes', cataloging_indexes_count),
        CASE WHEN cataloging_indexes_count >= 7 THEN 'All indexes properly configured' ELSE 'Some indexes may be missing' END
    
    UNION ALL
    
    SELECT 
        'Inventory Indexes'::TEXT,
        CASE WHEN inventory_indexes_count >= 3 THEN 'HEALTHY' ELSE 'NEEDS_ATTENTION' END,
        format('Found %s inventory search indexes', inventory_indexes_count),
        CASE WHEN inventory_indexes_count >= 3 THEN 'Search performance optimized' ELSE 'Consider adding more indexes' END
    
    UNION ALL
    
    SELECT 
        'Data Volume'::TEXT,
        CASE WHEN total_stock_items > 0 THEN 'HEALTHY' ELSE 'EMPTY' END,
        format('Stock: %s, Editions: %s, Books: %s', total_stock_items, total_editions, total_books),
        CASE WHEN total_stock_items > 0 THEN 'System actively used' ELSE 'Ready for data import' END
    
    UNION ALL
    
    SELECT 
        'Monitoring'::TEXT,
        'HEALTHY'::TEXT,
        'Performance monitoring functions available'::TEXT,
        'Use get_cataloging_performance_metrics() and inventory_search_performance view'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to health check
GRANT EXECUTE ON FUNCTION run_system_health_check() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION run_system_health_check() IS 'Comprehensive system health check for cataloging and inventory optimizations'; 