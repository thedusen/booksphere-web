-- Migration: rollback_function_cleanup
-- Date: 2025-08-03
-- Purpose: ROLLBACK MIGRATION - Recreates obsolete function versions if needed
-- 
-- IMPORTANT: Only apply this migration if the cleanup caused issues
-- This will restore the duplicate functions that were removed

-- WARNING: Applying this rollback will recreate duplicate functions
-- Only use if you need to restore the old behavior temporarily

-- Restore obsolete search_inventory version (offset-based pagination)
CREATE OR REPLACE FUNCTION public.search_inventory(
    search_query text DEFAULT '',
    filter_type text DEFAULT 'All',
    sort_by text DEFAULT 'date_added_to_stock DESC',
    filters jsonb DEFAULT '{}',
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
DECLARE
    current_org_id uuid;
BEGIN
    -- Security: Get organization from session context
    BEGIN
        current_org_id := current_setting('app.current_org_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Organization context not set. Access denied.';
    END;

    IF current_org_id IS NULL THEN
        RAISE EXCEPTION 'Invalid organization context. Access denied.';
    END IF;

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
                'has_photos', (e.edition_cover_image_url IS NOT NULL AND e.edition_cover_image_url != '')
            ) ORDER BY si.selling_price_amount ASC) as stock_items,
            (SELECT string_agg(a.name, ', ') FROM book_authors ba JOIN authors a ON ba.author_id = a.author_id WHERE ba.book_id = b.book_id LIMIT 1) as primary_author,
            max(si.date_added_to_stock) as max_date_added
        FROM editions e
        JOIN books b ON e.book_id = b.book_id
        LEFT JOIN publishers p ON e.publisher_id = p.publisher_id
        JOIN stock_items si ON e.edition_id = si.edition_id
        LEFT JOIN condition_standards cs ON si.condition_id = cs.condition_id
        WHERE si.organization_id = current_org_id
          AND (search_query = '' OR b.title ILIKE '%' || search_query || '%' 
               OR e.isbn13_ol ILIKE '%' || search_query || '%' 
               OR e.isbn10_ol ILIKE '%' || search_query || '%' 
               OR si.sku ILIKE '%' || search_query || '%' 
               OR EXISTS (
                   SELECT 1 FROM book_authors ba2 
                   JOIN authors a2 ON ba2.author_id = a2.author_id 
                   WHERE ba2.book_id = b.book_id 
                   AND a2.name ILIKE '%' || search_query || '%'
               ))
          AND (filters->'conditions' IS NULL 
               OR jsonb_array_length(filters->'conditions') = 0 
               OR cs.standard_name = ANY(SELECT jsonb_array_elements_text(filters->'conditions')))
        GROUP BY e.edition_id, b.book_id, p.publisher_id
    )
    SELECT es.edition_id, es.book_id, es.title, 
           COALESCE(es.primary_author, 'Unknown Author'), 
           es.cover_image_url, es.isbn13, es.isbn10, es.publisher_name, 
           es.published_date, es.total_copies, es.min_price, es.max_price, es.stock_items
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

-- Restore obsolete get_edition_details version (single parameter)
CREATE OR REPLACE FUNCTION public.get_edition_details(p_edition_id uuid)
RETURNS TABLE(
    edition_id uuid, 
    book_id uuid, 
    book_title text, 
    authors text, 
    edition_title_ol text, 
    edition_subtitle_ol text, 
    edition_cover_image_url text, 
    publisher_id uuid, 
    publish_date_text_ol text, 
    isbn13 text, 
    isbn10 text, 
    description_ol text, 
    stock_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.edition_id,
    e.book_id,
    b.title AS book_title,
    (
      SELECT string_agg(a.name, ', ')
      FROM book_authors ba
      JOIN authors a ON ba.author_id = a.author_id
      WHERE ba.book_id = b.book_id
    ) AS authors,
    e.edition_title_ol,
    e.edition_subtitle_ol,
    e.edition_cover_image_url,
    e.publisher_id,
    e.publish_date_text_ol,
    e.isbn13_ol AS isbn13,
    e.isbn10_ol AS isbn10,
    e.description_ol,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'stock_item_id', si.stock_item_id,
          'organization_id', si.organization_id,
          'sku', si.sku,
          'condition_description', si.condition_description,
          'selling_price_currency', si.selling_price_currency,
          'selling_price_amount', si.selling_price_amount,
          'purchase_cost_amount', si.purchase_cost_amount,
          'date_added_to_stock', si.date_added_to_stock,
          'is_active_for_sale', si.is_active_for_sale,
          'location_in_store_text', si.location_in_store_text,
          'quantity', si.quantity,
          'created_at', si.created_at,
          'updated_at', si.updated_at
        )
      )
      FROM stock_items si
      WHERE si.edition_id = e.edition_id
    ) AS stock_items
  FROM editions e
  JOIN books b ON e.book_id = b.book_id
  WHERE e.edition_id = p_edition_id;
END;
$$;

-- Restore obsolete create_data_quality_flag version (with title parameter)
CREATE OR REPLACE FUNCTION public.create_data_quality_flag(
    p_table_name text, 
    p_record_id text, 
    p_flag_type text, 
    p_severity text, 
    p_field_name text DEFAULT NULL, 
    p_status text DEFAULT 'open', 
    p_description text DEFAULT NULL, 
    p_suggested_value jsonb DEFAULT NULL, 
    p_details jsonb DEFAULT NULL, 
    p_title text DEFAULT NULL
)
RETURNS data_quality_flags
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_flag public.data_quality_flags;
    v_flagged_by uuid;
    v_organization_id uuid;
BEGIN
    -- Get user and org from session (assumes RLS policies are set up)
    v_flagged_by := auth.uid();
    v_organization_id := current_setting('request.jwt.claims', true)::json->>'organization_id';

    INSERT INTO public.data_quality_flags (
        table_name, record_id, field_name, flag_type, severity, status, description, suggested_value, details, flagged_by, organization_id, title
    ) VALUES (
        p_table_name, p_record_id, p_field_name, p_flag_type, p_severity, p_status, p_description, p_suggested_value, p_details, v_flagged_by, v_organization_id, p_title
    )
    RETURNING * INTO v_flag;

    RETURN v_flag;
END;
$$;

-- Restore obsolete get_paginated_flags version (without organization_id parameter)
CREATE OR REPLACE FUNCTION public.get_paginated_flags(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0, 
    p_status text DEFAULT NULL, 
    p_table_name text DEFAULT NULL, 
    p_severity text DEFAULT NULL, 
    p_search text DEFAULT NULL, 
    p_sort_by text DEFAULT 'created_at', 
    p_sort_dir text DEFAULT 'desc'
)
RETURNS TABLE(
    flag_id uuid, 
    table_name text, 
    record_id text, 
    field_name text, 
    flag_type text, 
    severity text, 
    status text, 
    description text, 
    suggested_value jsonb, 
    details jsonb, 
    flagged_by uuid, 
    organization_id uuid, 
    created_at timestamp with time zone, 
    reviewed_by uuid, 
    resolution_notes text, 
    resolved_at timestamp with time zone, 
    item_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id uuid := current_setting('request.jwt.claims', true)::json->>'organization_id';
    v_sql text;
    v_sort_col text;
    v_sort_dir text;
BEGIN
    -- Whitelist sortable columns to prevent SQL injection
    v_sort_col := CASE p_sort_by
        WHEN 'severity' THEN 'severity'
        WHEN 'item_title' THEN 'item_title'
        WHEN 'status' THEN 'status'
        ELSE 'created_at'
    END;

    -- Whitelist sort direction
    v_sort_dir := CASE lower(p_sort_dir)
        WHEN 'asc' THEN 'ASC'
        ELSE 'DESC'
    END;

    -- Using format() with %L for literals and %I for identifiers is the safest way to construct dynamic SQL.
    v_sql := format('
      WITH flag_items AS (
        SELECT f.*, b.title AS item_title
        FROM public.data_quality_flags f
        JOIN public.books b ON f.table_name = ''books'' AND f.record_id::uuid = b.book_id
        WHERE f.organization_id = %L
        UNION ALL
        SELECT f.*, e.edition_title_ol AS item_title
        FROM public.data_quality_flags f
        JOIN public.editions e ON f.table_name = ''editions'' AND f.record_id::uuid = e.edition_id
        WHERE f.organization_id = %L
        UNION ALL
        SELECT f.*, s.sku AS item_title
        FROM public.data_quality_flags f
        JOIN public.stock_items s ON f.table_name = ''stock_items'' AND f.record_id::uuid = s.stock_item_id
        WHERE f.organization_id = %L
      )
      SELECT flag_id, table_name, record_id, field_name, flag_type, severity, status, description, suggested_value, details, flagged_by, organization_id, created_at, reviewed_by, resolution_notes, resolved_at, item_title
      FROM flag_items
      WHERE (%L::text IS NULL OR status = %L)
        AND (%L::text IS NULL OR table_name = %L)
        AND (%L::text IS NULL OR severity = %L)
        AND (%L::text IS NULL OR (
            item_title ILIKE ''%%'' || %L || ''%%''
            OR description ILIKE ''%%'' || %L || ''%%''
            OR record_id ILIKE ''%%'' || %L || ''%%''
            OR field_name ILIKE ''%%'' || %L || ''%%''
        ))
      ORDER BY %I %s
      OFFSET %L LIMIT %L',
      v_org_id, -- for books
      v_org_id, -- for editions
      v_org_id, -- for stock_items
      p_status, p_status,
      p_table_name, p_table_name,
      p_severity, p_severity,
      p_search, p_search, p_search, p_search, p_search,
      v_sort_col,
      v_sort_dir,
      p_offset,
      p_limit
    );

    RETURN QUERY EXECUTE v_sql;
END;
$$;

-- Add rollback documentation
COMMENT ON FUNCTION public.search_inventory(text, text, text, jsonb, integer, integer) IS 
'ROLLBACK: Obsolete search_inventory function with offset pagination. Only restored for emergency rollback.';

COMMENT ON FUNCTION public.get_edition_details(uuid) IS 
'ROLLBACK: Obsolete get_edition_details function with single parameter. Only restored for emergency rollback.';

COMMENT ON FUNCTION public.create_data_quality_flag(text, text, text, text, text, text, text, jsonb, jsonb, text) IS 
'ROLLBACK: Obsolete create_data_quality_flag function with title parameter. Only restored for emergency rollback.';

COMMENT ON FUNCTION public.get_paginated_flags(integer, integer, text, text, text, text, text, text) IS 
'ROLLBACK: Obsolete get_paginated_flags function without organization_id parameter. Only restored for emergency rollback.';