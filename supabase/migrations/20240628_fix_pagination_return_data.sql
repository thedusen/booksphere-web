-- Migration: fix_pagination_return_data
-- This migration fixes the search_inventory function to return the max_date_added
-- column, which is required by the frontend for stable keyset pagination.

DROP FUNCTION IF EXISTS public.search_inventory(uuid, text, text, text, jsonb, integer, timestamptz, uuid);

CREATE OR REPLACE FUNCTION public.search_inventory(
    p_org_id uuid,
    p_search_query text DEFAULT '',
    p_filter_type text DEFAULT 'All',
    p_sort_by text DEFAULT 'date_added_to_stock DESC',
    p_filters jsonb DEFAULT '{}'::jsonb,
    p_limit_count integer DEFAULT 20,
    p_last_date_added timestamptz DEFAULT NULL,
    p_last_edition_id uuid DEFAULT NULL
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
    stock_items jsonb,
    max_date_added timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
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
    max(si.date_added_to_stock) as max_date_added,
    (SELECT string_agg(a.name, ', ') FROM book_authors ba JOIN authors a ON ba.author_id = a.author_id WHERE ba.book_id = b.book_id LIMIT 1) as primary_author,
    jsonb_agg(jsonb_build_object('stock_item_id', si.stock_item_id, 'condition_name', COALESCE(cs.standard_name, 'Unknown'))) as stock_items
FROM editions e
JOIN books b ON e.book_id = b.book_id
LEFT JOIN publishers p ON e.publisher_id = p.publisher_id
JOIN stock_items si ON e.edition_id = si.edition_id
LEFT JOIN condition_standards cs ON si.condition_id = cs.condition_id
WHERE si.organization_id = p_org_id AND (p_search_query = '' OR b.title ILIKE '%' || p_search_query || '%')
GROUP BY e.edition_id, b.book_id, p.publisher_id
)
SELECT es.edition_id, es.book_id, es.title, COALESCE(es.primary_author, 'Unknown Author'), es.cover_image_url, es.isbn13, es.isbn10, es.publisher_name, es.published_date, es.total_copies, es.min_price, es.max_price, es.stock_items, es.max_date_added
FROM edition_stock es
WHERE
  (p_last_date_added IS NULL)
  OR (es.max_date_added < p_last_date_added)
  OR (es.max_date_added = p_last_date_added AND es.edition_id > p_last_edition_id)
ORDER BY
  es.max_date_added DESC,
  es.edition_id ASC
LIMIT p_limit_count;
END;
$$; 