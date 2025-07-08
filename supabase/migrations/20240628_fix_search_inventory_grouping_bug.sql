-- Migration: fix_search_inventory_grouping_bug
-- Drops and recreates the search_inventory function to fix duplicate editions in paginated results

DROP FUNCTION IF EXISTS public.search_inventory(uuid, text, text, text, jsonb, integer, integer);

CREATE OR REPLACE FUNCTION public.search_inventory(
    org_id uuid,
    search_query text DEFAULT '',
    filter_type text DEFAULT 'All',
    sort_by text DEFAULT 'date_added_to_stock DESC',
    filters jsonb DEFAULT '{}'::jsonb,
    limit_count integer DEFAULT 20,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    edition_id uuid,
    book_id uuid,
    title text,
    primary_author text,
    cover_image_url text,
    isbn13 text,
    isbn10 text,
    publisher_name text,
    published_date text,
    total_copies bigint,
    min_price numeric,
    max_price numeric,
    stock_items jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Fallback query for complex searches and sorts
    RETURN QUERY
    WITH edition_stock AS (
        SELECT
            e.edition_id,
            b.book_id,
            COALESCE(b.title, 'Unknown Title') as title,
            e.edition_cover_image_url as cover_image_url,
            e.isbn13_ol::text as isbn13,
            e.isbn10_ol::text as isbn10,
            e.publish_date_text_ol as published_date,
            COALESCE(p.name, '') as publisher_name,
            count(si.stock_item_id) as total_copies,
            min(si.selling_price_amount) as min_price,
            max(si.selling_price_amount) as max_price,
            jsonb_agg(jsonb_build_object(
                'stock_item_id', si.stock_item_id,
                'condition_name', COALESCE(cs.standard_name, 'Unknown'),
                'selling_price_amount', si.selling_price_amount,
                'sku', si.sku,
                'location_in_store_text', si.location_in_store_text,
                'date_added_to_stock', si.date_added_to_stock,
                'is_active_for_sale', si.is_active_for_sale,
                'has_photos', (e.edition_cover_image_url IS NOT NULL AND e.edition_cover_image_url != ''),
                'marketplace_listings', COALESCE((SELECT jsonb_agg(jsonb_build_object('marketplace_name', m.name, 'status', ml.status)) FROM marketplace_listings ml JOIN marketplaces m ON ml.marketplace_id = m.marketplace_id WHERE ml.stock_item_id = si.stock_item_id), '[]'::jsonb)
            ) ORDER BY si.selling_price_amount ASC) as stock_items,
            (SELECT string_agg(a.name, ', ') FROM book_authors ba JOIN authors a ON ba.author_id = a.author_id WHERE ba.book_id = b.book_id LIMIT 1) as primary_author,
            max(si.date_added_to_stock) as max_date_added
        FROM editions e
        JOIN books b ON e.book_id = b.book_id
        LEFT JOIN publishers p ON e.publisher_id = p.publisher_id
        JOIN stock_items si ON e.edition_id = si.edition_id
        LEFT JOIN condition_standards cs ON si.condition_id = cs.condition_id
        WHERE si.organization_id = org_id
          AND (search_query = '' OR b.title ILIKE '%' || search_query || '%' OR e.isbn13_ol ILIKE '%' || search_query || '%' OR e.isbn10_ol ILIKE '%' || search_query || '%' OR si.sku ILIKE '%' || search_query || '%' OR EXISTS (SELECT 1 FROM book_authors ba2 JOIN authors a2 ON ba2.author_id = a2.author_id WHERE ba2.book_id = b.book_id AND a2.name ILIKE '%' || search_query || '%'))
          AND (filters->'conditions' IS NULL OR jsonb_array_length(filters->'conditions') = 0 OR cs.standard_name = ANY(SELECT jsonb_array_elements_text(filters->'conditions')))
        GROUP BY e.edition_id, b.book_id, p.publisher_id -- CORRECTED LINE
    )
    SELECT es.edition_id, es.book_id, es.title, COALESCE(es.primary_author, 'Unknown Author'), es.cover_image_url, es.isbn13, es.isbn10, es.publisher_name, es.published_date, es.total_copies, es.min_price, es.max_price, es.stock_items
    FROM edition_stock es
    ORDER BY
      CASE WHEN sort_by = 'title ASC' THEN es.title END ASC,
      CASE WHEN sort_by = 'title DESC' THEN es.title END DESC,
      CASE WHEN sort_by = 'date_added_to_stock DESC' THEN es.max_date_added END DESC,
      CASE WHEN sort_by = 'date_added_to_stock ASC' THEN es.max_date_added END ASC,
      es.max_date_added DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$; 