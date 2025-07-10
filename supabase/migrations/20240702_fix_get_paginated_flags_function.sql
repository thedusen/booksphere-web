-- 20240702_fix_get_paginated_flags_function.sql
-- This function corrects and replaces the previous version of get_paginated_flags.
-- Key fixes:
-- 1. Enforces multi-tenancy by filtering on organization_id from the JWT.
-- 2. Resolves item_title by joining with books, editions, and stock_items.
-- 3. Fixes a critical bug by casting record_id from text to uuid for joins.
-- 4. Restores comprehensive search across title, description, record_id, and field_name.
-- 5. Implements safe, whitelisted dynamic sorting to prevent SQL injection.

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
RETURNS TABLE (
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
    created_at timestamptz,
    reviewed_by uuid,
    resolution_notes text,
    resolved_at timestamptz,
    item_title text
) AS $$
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
    -- '%%' is the escape sequence for a literal '%' in format().
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
