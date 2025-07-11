-- Safe performance optimizations for inventory search
-- These are non-breaking and focus on existing heavily-used patterns

-- 1. Optimize stock_items organization queries (41k+ records)
-- Using regular CREATE INDEX for transaction safety
CREATE INDEX IF NOT EXISTS idx_stock_items_org_active
ON stock_items (organization_id, is_active_for_sale, created_at DESC)
WHERE is_active_for_sale = true;

-- 2. Optimize edition ISBN lookups (commonly used for cataloging)
CREATE INDEX IF NOT EXISTS idx_editions_isbn13_lookup
ON editions (isbn13_ol) WHERE isbn13_ol IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_editions_isbn10_lookup  
ON editions (isbn10_ol) WHERE isbn10_ol IS NOT NULL;

-- 3. Optimize book title searches (38k+ records)
CREATE INDEX IF NOT EXISTS idx_books_title_search
ON books USING gin (to_tsvector('english', title))
WHERE title IS NOT NULL;

-- 4. Add monitoring for these new indexes
CREATE OR REPLACE VIEW inventory_search_performance AS
SELECT 
    s.relname as table_name,
    s.indexrelname as index_name,
    s.idx_scan as scans,
    s.idx_tup_read as tuples_read,
    s.idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN s.idx_scan = 0 THEN 'UNUSED'
        WHEN s.idx_scan < 10 THEN 'LOW'
        WHEN s.idx_scan < 100 THEN 'MODERATE'
        ELSE 'HIGH'
    END as usage_level
FROM pg_stat_user_indexes s
WHERE s.relname IN ('stock_items', 'editions', 'books')
ORDER BY s.idx_scan DESC;

-- Grant access to the view
GRANT SELECT ON inventory_search_performance TO authenticated;

-- Add helpful comment
COMMENT ON VIEW inventory_search_performance IS 'Monitor inventory search performance and index usage patterns'; 